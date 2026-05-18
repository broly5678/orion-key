package com.orionkey.service.impl;

import com.orionkey.constant.CardKeyStatus;
import com.orionkey.constant.ErrorCode;
import com.orionkey.constant.OrderStatus;
import com.orionkey.entity.*;
import com.orionkey.exception.BusinessException;
import com.orionkey.repository.*;
import com.orionkey.service.DeliverService;
import com.orionkey.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeliverServiceImpl implements DeliverService {

    private static final int PUBLIC_QUERY_WINDOW_DAYS = 30;

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CardKeyRepository cardKeyRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final PointsLogRepository pointsLogRepository;
    private final SiteConfigRepository siteConfigRepository;
    private final UnmatchedTransactionRepository unmatchedTransactionRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Override
    @SuppressWarnings("unchecked")
    @Transactional
    public List<?> queryOrders(Map<String, Object> request) {
        Set<UUID> orderIds = new LinkedHashSet<>();

        List<String> orderIdStrs = (List<String>) request.get("order_ids");
        if (orderIdStrs != null) {
            orderIdStrs.forEach(id -> orderIds.add(UUID.fromString(id)));
        }

        List<String> emails = (List<String>) request.get("emails");
        if (emails != null && !emails.isEmpty()) {
            List<Order> emailOrders = orderRepository.findByEmailInOrderByCreatedAtDesc(emails);
            emailOrders.forEach(o -> orderIds.add(o.getId()));
        }

        List<String> contactValues = (List<String>) request.get("contact_values");
        if (contactValues != null && !contactValues.isEmpty()) {
            List<Order> contactOrders = orderRepository.findByContactValueInOrderByCreatedAtDesc(contactValues);
            contactOrders.forEach(o -> orderIds.add(o.getId()));
        }

        if (orderIds.isEmpty()) {
            throw new BusinessException(ErrorCode.ORDER_NOT_FOUND, "订单不存在");
        }

        List<Order> orders = orderRepository.findByIdIn(new ArrayList<>(orderIds));
        LocalDateTime queryCutoff = LocalDateTime.now().minusDays(PUBLIC_QUERY_WINDOW_DAYS);
        orders = new ArrayList<>(orders.stream()
                .filter(o -> o.getCreatedAt() != null && !o.getCreatedAt().isBefore(queryCutoff))
                .toList());
        if (orders.isEmpty()) {
            throw new BusinessException(ErrorCode.ORDER_NOT_FOUND, "仅支持查询最近 " + PUBLIC_QUERY_WINDOW_DAYS + " 天内的订单");
        }

        // 主动过期检查：PENDING 且已超时的订单标记为 EXPIRED（与 getOrderStatus 逻辑一致）
        LocalDateTime now = LocalDateTime.now();
        for (Order o : orders) {
            if (o.getStatus() == OrderStatus.PENDING && o.getExpiresAt().isBefore(now)) {
                o.setStatus(OrderStatus.EXPIRED);
                orderRepository.save(o);
            }
        }

        // Sort by createdAt desc
        orders.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

        return orders.stream().map(o -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", o.getId());
            map.put("total_amount", o.getTotalAmount());
            map.put("actual_amount", o.getActualAmount());
            map.put("currency", o.getCurrency());
            map.put("status", o.getStatus().name());
            map.put("order_type", o.getOrderType().name());
            map.put("payment_method", o.getPaymentMethod());
            map.put("created_at", o.getCreatedAt());
            map.put("contact_type", o.getContactType());
            map.put("contact_value", o.getContactValue());
            map.put("has_query_password", o.getQueryPasswordHash() != null && !o.getQueryPasswordHash().isBlank());
            // USDT 订单：附带 TXID 审核状态（供用户查询页展示审核结果反馈）
            if (o.getPaymentMethod() != null && o.getPaymentMethod().startsWith("usdt_")) {
                map.put("usdt_tx_id", o.getUsdtTxId());
                List<UnmatchedTransaction> reviews = unmatchedTransactionRepository.findByOrderId(o.getId());
                if (!reviews.isEmpty()) {
                    // 取最新一条（按提交时间倒序）
                    UnmatchedTransaction latest = reviews.stream()
                            .max(java.util.Comparator.comparing(UnmatchedTransaction::getSubmittedAt))
                            .orElse(reviews.get(0));
                    map.put("txid_review_status", latest.getStatus());
                    map.put("txid_review_reason", latest.getVerifyReason());
                }
            }
            return map;
        }).toList();
    }

    @Override
    @SuppressWarnings("unchecked")
    @Transactional
    public List<?> deliverOrders(Map<String, Object> request) {
        List<String> orderIdStrs = (List<String>) request.get("order_ids");
        if (orderIdStrs == null || orderIdStrs.isEmpty()) {
            throw new BusinessException(ErrorCode.ORDER_NOT_FOUND, "订单不存在");
        }

        List<Map<String, Object>> results = new ArrayList<>();
        for (String idStr : orderIdStrs) {
            UUID orderId = UUID.fromString(idStr);
            results.add(deliverSingleOrder(orderId));
        }
        return results;
    }

    @Override
    @Transactional
    public Map<String, Object> unlockOrder(UUID orderId, String queryPassword) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND, "订单不存在"));
        validateQueryPassword(order, queryPassword);

        Map<String, Object> result = deliverSingleOrder(orderId);
        Order refreshed = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND, "订单不存在"));

        String accessToken = UUID.randomUUID().toString().replace("-", "");
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(10);
        refreshed.setQueryAccessToken(accessToken);
        refreshed.setQueryAccessExpiresAt(expiresAt);
        orderRepository.save(refreshed);

        result.put("access_token", accessToken);
        result.put("access_expires_at", expiresAt);
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        if (!items.isEmpty()) {
            Product product = findFirstProduct(items.get(0).getProductId());
            result.put("leave_message", product != null ? product.getLeaveMessage() : null);
        }
        return result;
    }

    private Map<String, Object> deliverSingleOrder(UUID orderId) {
        // F2: 悲观锁 — 防止同一 PAID 订单被并发请求重复发货分配双份卡密
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND, "订单不存在"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("order_id", orderId);

        switch (order.getStatus()) {
            case DELIVERED -> {
                result.put("status", "DELIVERED");
                result.put("groups", buildCardKeyGroups(orderId));
            }
            case PAID -> {
                List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
                // F17: 发货前校验所有订单项数量，异常时立即标记 EXPIRED，防止前端反复重试
                for (OrderItem item : items) {
                    if (item.getQuantity() <= 0) {
                        log.error("Order {} contains item with invalid quantity={}, marking EXPIRED to block retries",
                                orderId, item.getQuantity());
                        order.setStatus(OrderStatus.EXPIRED);
                        orderRepository.save(order);
                        result.put("status", "EXPIRED");
                        result.put("groups", List.of());
                        return result;
                    }
                }
                try {
                    List<CardKey> allAllocated = new ArrayList<>();
                    for (OrderItem item : items) {
                        List<CardKey> keys = cardKeyRepository.findAndLockAvailable(
                                item.getProductId(), item.getSpecId(), item.getQuantity());
                        if (keys.size() < item.getQuantity()) {
                            throw new BusinessException(ErrorCode.ORDER_OUT_OF_STOCK, "缺货补货中，请联系客服");
                        }
                        for (CardKey key : keys) {
                            key.setStatus(CardKeyStatus.SOLD);
                            key.setOrderId(orderId);
                            key.setOrderItemId(item.getId());
                            key.setSoldAt(LocalDateTime.now());
                            cardKeyRepository.save(key);
                        }
                        allAllocated.addAll(keys);
                    }

                    order.setStatus(OrderStatus.DELIVERED);
                    order.setDeliveredAt(LocalDateTime.now());
                    orderRepository.save(order);

                    // Award points
                    awardPoints(order);

                    // Send delivery email after transaction commits (async, non-blocking)
                    TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            emailService.sendDeliveryEmail(orderId);
                        }
                    });

                    result.put("status", "DELIVERED");
                    result.put("groups", buildCardKeyGroups(orderId));
                } catch (BusinessException e) {
                    result.put("status", "PAID");
                    result.put("groups", List.of());
                    log.warn("Deliver failed for order {}: {}", orderId, e.getMessage());
                }
            }
            case PENDING -> {
                result.put("status", "PENDING");
                result.put("groups", List.of());
            }
            case EXPIRED -> {
                result.put("status", "EXPIRED");
                result.put("groups", List.of());
            }
        }
        return result;
    }

    @Override
    public String exportCardKeys(UUID orderId, String accessToken) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND, "订单不存在"));
        validateAccessToken(order, accessToken);
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new BusinessException(ErrorCode.ORDER_NOT_PAID, "订单未发货");
        }

        List<CardKey> keys = cardKeyRepository.findByOrderId(orderId);
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        Map<UUID, OrderItem> itemMap = items.stream().collect(Collectors.toMap(OrderItem::getId, i -> i));

        StringBuilder sb = new StringBuilder();
        sb.append("订单号: ").append(orderId).append("\n");
        sb.append("=".repeat(40)).append("\n\n");

        Map<UUID, List<CardKey>> grouped = keys.stream()
                .filter(k -> k.getOrderItemId() != null)
                .collect(Collectors.groupingBy(CardKey::getOrderItemId));

        for (Map.Entry<UUID, List<CardKey>> entry : grouped.entrySet()) {
            OrderItem item = itemMap.get(entry.getKey());
            if (item != null) {
                sb.append("商品: ").append(item.getProductTitle());
                if (item.getSpecName() != null) sb.append(" [").append(item.getSpecName()).append("]");
                sb.append("\n");
                for (CardKey key : entry.getValue()) {
                    sb.append(key.getContent()).append("\n");
                }
                sb.append("\n");
            }
        }
        return sb.toString();
    }

    private List<Map<String, Object>> buildCardKeyGroups(UUID orderId) {
        List<CardKey> keys = cardKeyRepository.findByOrderId(orderId);
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        Map<UUID, OrderItem> itemMap = items.stream().collect(Collectors.toMap(OrderItem::getId, i -> i));

        Map<UUID, List<CardKey>> grouped = keys.stream()
                .filter(k -> k.getOrderItemId() != null)
                .collect(Collectors.groupingBy(CardKey::getOrderItemId));

        List<Map<String, Object>> groups = new ArrayList<>();
        for (Map.Entry<UUID, List<CardKey>> entry : grouped.entrySet()) {
            OrderItem item = itemMap.get(entry.getKey());
            if (item != null) {
                Map<String, Object> g = new LinkedHashMap<>();
                g.put("product_title", item.getProductTitle());
                g.put("spec_name", item.getSpecName());
                g.put("card_keys", entry.getValue().stream().map(CardKey::getContent).toList());
                groups.add(g);
            }
        }
        return groups;
    }

    private void awardPoints(Order order) {
        if (order.getUserId() == null) return;
        boolean pointsEnabled = siteConfigRepository.findByConfigKey("points_enabled")
                .map(c -> "true".equalsIgnoreCase(c.getConfigValue()))
                .orElse(false);
        if (!pointsEnabled) return;

        int pointsRate = siteConfigRepository.findByConfigKey("points_rate")
                .map(c -> { try { return Integer.parseInt(c.getConfigValue()); } catch (Exception e) { return 0; } })
                .orElse(0);
        if (pointsRate <= 0) return;

        int pointsEarned = order.getActualAmount().multiply(java.math.BigDecimal.valueOf(pointsRate))
                .setScale(0, java.math.RoundingMode.FLOOR).intValue();
        if (pointsEarned <= 0) return;

        User user = userRepository.findById(order.getUserId()).orElse(null);
        if (user == null) return;

        user.setPoints(user.getPoints() + pointsEarned);
        userRepository.save(user);

        PointsLog log = new PointsLog();
        log.setUserId(user.getId());
        log.setChangeAmount(pointsEarned);
        log.setBalanceAfter(user.getPoints());
        log.setReason("购物奖励积分");
        log.setOrderId(order.getId());
        pointsLogRepository.save(log);
    }

    private void validateQueryPassword(Order order, String queryPassword) {
        String hash = order.getQueryPasswordHash();
        if (hash == null || hash.isBlank()) {
            return;
        }
        if (queryPassword == null || queryPassword.isBlank() || !passwordEncoder.matches(queryPassword, hash)) {
            throw new BusinessException(ErrorCode.ORDER_QUERY_PASSWORD_INVALID, "查询密码错误");
        }
    }

    private void validateAccessToken(Order order, String accessToken) {
        if (accessToken == null || accessToken.isBlank()
                || order.getQueryAccessToken() == null
                || !accessToken.equals(order.getQueryAccessToken())
                || order.getQueryAccessExpiresAt() == null
                || order.getQueryAccessExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException(ErrorCode.ORDER_QUERY_TOKEN_INVALID, "订单访问凭证无效或已过期");
        }
    }

    private Product findFirstProduct(UUID productId) {
        return productId == null ? null : productRepository.findById(productId).orElse(null);
    }
}
