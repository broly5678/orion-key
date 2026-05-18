package com.orionkey.service.impl;

import com.orionkey.constant.CardKeyStatus;
import com.orionkey.constant.ErrorCode;
import com.orionkey.constant.OrderStatus;
import com.orionkey.constant.OrderType;
import com.orionkey.entity.*;
import com.orionkey.exception.BusinessException;
import com.orionkey.repository.*;
import com.orionkey.service.CurrencyRateService;
import com.orionkey.service.OrderService;
import com.orionkey.service.PaymentService;
import com.orionkey.util.PaymentCurrencyUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final ProductSpecRepository productSpecRepository;
    private final WholesaleRuleRepository wholesaleRuleRepository;
    private final CartItemRepository cartItemRepository;
    private final CardKeyRepository cardKeyRepository;
    private final SiteConfigRepository siteConfigRepository;
    private final PaymentChannelRepository paymentChannelRepository;
    private final PaymentService paymentService;
    private final CurrencyRateService currencyRateService;
    private final PasswordEncoder passwordEncoder;

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^1\\d{10}$");
    private static final Pattern QQ_PATTERN = Pattern.compile("^[1-9][0-9]{4,11}$");

    @Override
    @Transactional
    public Map<String, Object> createDirectOrder(Map<String, Object> req, UUID userId, String clientIp, String sessionToken) {
        String device = (String) req.get("device");
        String idempotencyKey = (String) req.get("idempotency_key");
        if (idempotencyKey != null) {
            Optional<Order> existing = orderRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                Order existingOrder = existing.get();
                // F13: 幂等归属校验 — 确保是同一用户/会话的请求，防止通过幂等键探测他人订单
                boolean sameOwner = (userId != null && userId.equals(existingOrder.getUserId()))
                        || (userId == null && existingOrder.getUserId() == null
                            && Objects.equals(sessionToken, existingOrder.getSessionToken()));
                if (sameOwner) {
                    return buildOrderResult(existingOrder, device);
                }
                // 不同用户/会话的相同幂等键 — 清除以避免唯一约束冲突，视为无幂等键的新订单
                idempotencyKey = null;
            }
        }

        UUID productId = UUID.fromString((String) req.get("product_id"));
        UUID specId = req.get("spec_id") != null ? UUID.fromString((String) req.get("spec_id")) : null;
        int quantity = ((Number) req.get("quantity")).intValue();
        String email = (String) req.get("email");
        String contactValue = normalizeText((String) req.get("contact_value"));
        String queryPassword = normalizeText((String) req.get("query_password"));

        // F4: 购买数量校验（读取后台配置，兜底 999）
        int maxQuantity = getMaxPurchasePerUser();
        if (quantity < 1 || quantity > maxQuantity) {
            throw new BusinessException(ErrorCode.PURCHASE_LIMIT_EXCEEDED, "购买数量无效，允许范围 1~" + maxQuantity,
                    Map.of("max", maxQuantity));
        }

        // F14: 提前提取 email，用于 pending 订单限制（email + IP 双维度防刷）
        checkPendingOrderLimits(userId, clientIp, email);
        String paymentMethod = (String) req.get("payment_method");
        String locale = (String) req.get("locale");
        validatePaymentMethod(paymentMethod);

        Product product = productRepository.findById(productId)
                .filter(p -> p.getIsDeleted() == 0 && p.isEnabled())
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND, "商品不存在或已下架"));

        validatePurchaseConstraints(product, quantity, userId, sessionToken);
        String normalizedContact = normalizeAndValidateContact(product.getContactType(), contactValue);
        validateQueryPassword(product, queryPassword);

        // F18: 规格模式安全校验 — 防止通过伪造 spec_id 访问非当前模式的库存池或获取不同价格
        validateSpecConsistency(product, specId);

        // Stock check (advisory)
        long available = specId != null
                ? cardKeyRepository.countByProductIdAndSpecIdAndStatus(productId, specId, CardKeyStatus.AVAILABLE)
                : cardKeyRepository.countByProductIdAndSpecIdIsNullAndStatus(productId, CardKeyStatus.AVAILABLE);
        if (available < quantity) {
            throw new BusinessException(ErrorCode.INSUFFICIENT_STOCK, "库存不足",
                    Map.of("available", available));
        }

        BigDecimal sourceUnitPrice = getUnitPrice(product, specId, quantity);
        String sourceCurrency = normalizeProductCurrency(product.getCurrency());
        String settlementCurrency = PaymentCurrencyUtils.resolveSettlementCurrency(paymentMethod, locale, sourceCurrency);
        BigDecimal unitPrice = currencyRateService.convert(sourceUnitPrice, sourceCurrency, settlementCurrency);
        BigDecimal totalAmount = PaymentCurrencyUtils.scaleForCurrency(
                unitPrice.multiply(BigDecimal.valueOf(quantity)),
                settlementCurrency
        );
        if (totalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "订单金额异常，请联系客服");
        }
        int expireMinutes = getConfigInt("order_expire_minutes", 15);

        Order order = new Order();
        order.setUserId(userId);
        order.setEmail(normalizeEmail(email));
        order.setContactType(normalizeContactType(product.getContactType()));
        order.setContactValue(normalizedContact);
        if (product.isQueryPasswordEnabled()) {
            order.setQueryPasswordHash(passwordEncoder.encode(queryPassword));
        }
        order.setTotalAmount(totalAmount);
        order.setActualAmount(totalAmount);
        order.setCurrency(settlementCurrency);
        order.setStatus(OrderStatus.PENDING);
        order.setOrderType(OrderType.DIRECT);
        order.setPaymentMethod(paymentMethod);
        order.setExpiresAt(LocalDateTime.now().plusMinutes(expireMinutes));
        order.setIdempotencyKey(idempotencyKey);
        order.setClientIp(clientIp);
        order.setSessionToken(sessionToken);
        orderRepository.save(order);

        String specName = null;
        if (specId != null) {
            ProductSpec spec = productSpecRepository.findById(specId).orElse(null);
            specName = spec != null ? spec.getName() : null;
        }

        OrderItem item = new OrderItem();
        item.setOrderId(order.getId());
        item.setProductId(productId);
        item.setSpecId(specId);
        item.setProductTitle(product.getTitle());
        item.setSpecName(specName);
        item.setQuantity(quantity);
        item.setUnitPrice(unitPrice);
        item.setSubtotal(totalAmount);
        orderItemRepository.save(item);

        return buildOrderResult(order, device);
    }

    @Override
    @Transactional
    public Map<String, Object> createCartOrder(Map<String, Object> req, UUID userId, String clientIp, String sessionToken) {
        String device = (String) req.get("device");
        String idempotencyKey = (String) req.get("idempotency_key");
        if (idempotencyKey != null) {
            Optional<Order> existing = orderRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                Order existingOrder = existing.get();
                boolean sameOwner = (userId != null && userId.equals(existingOrder.getUserId()))
                        || (userId == null && existingOrder.getUserId() == null
                            && Objects.equals(sessionToken, existingOrder.getSessionToken()));
                if (sameOwner) {
                    return buildOrderResult(existingOrder, device);
                }
                // 不同用户/会话的相同幂等键 — 清除以避免唯一约束冲突，视为无幂等键的新订单
                idempotencyKey = null;
            }
        }

        String email = (String) req.get("email");
        String queryPassword = normalizeText((String) req.get("query_password"));
        checkPendingOrderLimits(userId, clientIp, email);
        String paymentMethod = (String) req.get("payment_method");
        String locale = (String) req.get("locale");
        validatePaymentMethod(paymentMethod);

        List<CartItem> cartItems;
        if (userId != null) {
            cartItems = cartItemRepository.findByUserId(userId);
        } else if (sessionToken != null) {
            cartItems = cartItemRepository.findBySessionToken(sessionToken);
        } else {
            cartItems = List.of();
        }
        if (cartItems.isEmpty()) {
            throw new BusinessException(ErrorCode.CART_EMPTY, "购物车为空");
        }

        CartOrderContext cartContext = resolveCartOrderContext(cartItems, userId, sessionToken, queryPassword);

        // 购物车每项数量校验（与直接下单统一上限）
        int maxQuantity = getMaxPurchasePerUser();
        for (CartItem ci : cartItems) {
            if (ci.getQuantity() < 1 || ci.getQuantity() > maxQuantity) {
                throw new BusinessException(ErrorCode.PURCHASE_LIMIT_EXCEEDED,
                        "购买数量无效，允许范围 1~" + maxQuantity,
                        Map.of("max", maxQuantity));
            }
        }

        int expireMinutes = getConfigInt("order_expire_minutes", 15);
        BigDecimal totalAmount = BigDecimal.ZERO;
        String settlementCurrency = PaymentCurrencyUtils.resolveSettlementCurrency(paymentMethod, locale, "CNY");

        Order order = new Order();
        order.setUserId(userId);
        order.setEmail(normalizeEmail(email));
        order.setContactType("EMAIL");
        order.setContactValue(normalizeEmail(email));
        if (cartContext.requiresQueryPassword()) {
            order.setQueryPasswordHash(passwordEncoder.encode(queryPassword));
        }
        order.setStatus(OrderStatus.PENDING);
        order.setOrderType(OrderType.CART);
        order.setPaymentMethod(paymentMethod);
        order.setCurrency(settlementCurrency);
        order.setExpiresAt(LocalDateTime.now().plusMinutes(expireMinutes));
        order.setIdempotencyKey(idempotencyKey);
        order.setClientIp(clientIp);
        order.setSessionToken(sessionToken);
        orderRepository.save(order);

        for (CartItem ci : cartItems) {
            // F15: 防御性数量校验 — 购物车项数量必须为正整数，防止负数数量绕过价格计算
            if (ci.getQuantity() < 1) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "购物车包含无效数量，请刷新购物车后重试");
            }

            Product product = productRepository.findById(ci.getProductId())
                    .filter(p -> p.getIsDeleted() == 0 && p.isEnabled())
                    .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND, "商品不存在或已下架"));

            validatePurchaseConstraints(product, ci.getQuantity(), userId, sessionToken);

            // F18: 规格模式安全校验
            validateSpecConsistency(product, ci.getSpecId());

            // Advisory stock check (same pattern as createDirectOrder)
            long available = ci.getSpecId() != null
                    ? cardKeyRepository.countByProductIdAndSpecIdAndStatus(ci.getProductId(), ci.getSpecId(), CardKeyStatus.AVAILABLE)
                    : cardKeyRepository.countByProductIdAndSpecIdIsNullAndStatus(ci.getProductId(), CardKeyStatus.AVAILABLE);
            if (available < ci.getQuantity()) {
                throw new BusinessException(ErrorCode.INSUFFICIENT_STOCK,
                        "商品「" + product.getTitle() + "」库存不足",
                        Map.of("available", available, "title", product.getTitle()));
            }

            BigDecimal sourceUnitPrice = getUnitPrice(product, ci.getSpecId(), ci.getQuantity());
            BigDecimal unitPrice = currencyRateService.convert(
                    sourceUnitPrice,
                    normalizeProductCurrency(product.getCurrency()),
                    settlementCurrency
            );
            BigDecimal subtotal = PaymentCurrencyUtils.scaleForCurrency(
                    unitPrice.multiply(BigDecimal.valueOf(ci.getQuantity())),
                    settlementCurrency
            );
            totalAmount = totalAmount.add(subtotal);

            String specName = null;
            if (ci.getSpecId() != null) {
                ProductSpec spec = productSpecRepository.findById(ci.getSpecId()).orElse(null);
                specName = spec != null ? spec.getName() : null;
            }

            OrderItem item = new OrderItem();
            item.setOrderId(order.getId());
            item.setProductId(ci.getProductId());
            item.setSpecId(ci.getSpecId());
            item.setProductTitle(product.getTitle());
            item.setSpecName(specName);
            item.setQuantity(ci.getQuantity());
            item.setUnitPrice(unitPrice);
            item.setSubtotal(subtotal);
            orderItemRepository.save(item);
        }

        // F16: 订单金额必须为正数 — 防止负数商品价格叠加导致极低金额下单
        if (totalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "订单金额异常，请联系客服");
        }

        totalAmount = PaymentCurrencyUtils.scaleForCurrency(totalAmount, settlementCurrency);
        order.setTotalAmount(totalAmount);
        order.setActualAmount(totalAmount);
        orderRepository.save(order);

        // Clear cart after order creation to prevent duplicate orders from same cart items
        for (CartItem ci : cartItems) {
            cartItemRepository.delete(ci);
        }

        return buildOrderResult(order, device);
    }

    @Override
    @Transactional
    public Map<String, Object> getOrderStatus(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND, "订单不存在"));
        // Auto expire check
        if (order.getStatus() == OrderStatus.PENDING && order.getExpiresAt().isBefore(LocalDateTime.now())) {
            order.setStatus(OrderStatus.EXPIRED);
            orderRepository.save(order);
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("order_id", order.getId());
        result.put("status", order.getStatus().name());
        result.put("expires_at", order.getExpiresAt());
        // 返回服务端计算的剩余秒数，前端倒计时以此为准，不受客户端时钟影响
        if (order.getStatus() == OrderStatus.PENDING) {
            long remainingSeconds = Duration.between(LocalDateTime.now(), order.getExpiresAt()).getSeconds();
            result.put("remaining_seconds", Math.max(0, remainingSeconds));
        } else {
            result.put("remaining_seconds", 0);
        }
        if (order.getStatus() == OrderStatus.PENDING) {
            // 优先返回二维码 URL（PC），其次 H5 跳转链接（移动端）
            String effectiveUrl = order.getQrcodeUrl() != null ? order.getQrcodeUrl() : order.getPaymentUrl();
            if (effectiveUrl != null) {
                result.put("payment_url", effectiveUrl);
            }
        }
        return result;
    }

    @Override
    public Map<String, Object> refreshOrderStatus(UUID orderId) {
        // In a real implementation, this would query the payment provider
        return getOrderStatus(orderId);
    }

    @Override
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void expireOrders() {
        List<Order> expired = orderRepository.findExpiredOrders(LocalDateTime.now());
        for (Order order : expired) {
            order.setStatus(OrderStatus.EXPIRED);
            orderRepository.save(order);
            log.info("Order expired: {}", order.getId());
        }
    }

    private BigDecimal getUnitPrice(Product product, UUID specId, int quantity) {
        BigDecimal basePrice = product.getBasePrice();
        if (specId != null) {
            // F1: 严格校验规格归属 — 防止用低价规格 ID 篡改高价商品的价格
            ProductSpec spec = productSpecRepository.findById(specId)
                    .filter(s -> s.getProductId().equals(product.getId()) && s.getIsDeleted() == 0)
                    .orElseThrow(() -> new BusinessException(ErrorCode.SPEC_NOT_FOUND, "商品规格不存在或与商品不匹配"));
            basePrice = spec.getPrice();
        }

        if (product.isWholesaleEnabled()) {
            List<WholesaleRule> rules;
            if (specId != null) {
                rules = wholesaleRuleRepository.findByProductIdAndSpecIdOrderByMinQuantityAsc(product.getId(), specId);
            } else {
                rules = wholesaleRuleRepository.findByProductIdAndSpecIdIsNullOrderByMinQuantityAsc(product.getId());
            }
            // Find matching tier (highest minQuantity <= quantity)
            for (int i = rules.size() - 1; i >= 0; i--) {
                if (quantity >= rules.get(i).getMinQuantity()) {
                    return rules.get(i).getUnitPrice();
                }
            }
        }
        return basePrice;
    }

    private void checkPendingOrderLimits(UUID userId, String clientIp, String email) {
        // 邮箱和 IP 共用同一配置值（面板"最大待支付订单数"）
        int maxPending = getConfigInt("max_pending_orders_per_user", 5);

        if (userId != null) {
            long pending = orderRepository.countByUserIdAndStatus(userId, OrderStatus.PENDING);
            if (pending >= maxPending) {
                throw new BusinessException(ErrorCode.UNPAID_ORDER_EXISTS, "您有未支付的订单，请先完成支付或等待过期");
            }
        }
        if (clientIp != null) {
            long pending = orderRepository.countByClientIpAndStatus(clientIp, OrderStatus.PENDING);
            if (pending >= maxPending) {
                throw new BusinessException(ErrorCode.UNPAID_ORDER_EXISTS, "您有未支付的订单，请先完成支付或等待过期");
            }
        }
        // F14: 邮箱维度 pending 订单限制 — 防止通过 IP 轮换绕过限制
        if (email != null && !email.isBlank()) {
            long pending = orderRepository.countByEmailAndStatus(email, OrderStatus.PENDING);
            if (pending >= maxPending) {
                throw new BusinessException(ErrorCode.UNPAID_ORDER_EXISTS, "该邮箱有未支付的订单，请先完成支付或等待过期");
            }
        }
    }

    private Map<String, Object> buildOrderResult(Order order, String device) {
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        Map<String, Object> orderDetail = toOrderDetail(order, items);
        Map<String, Object> payment = paymentService.createPayment(
                order.getId(), order.getPaymentMethod(), order.getActualAmount(), device);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("order", orderDetail);
        result.put("payment", payment);
        return result;
    }

    private Map<String, Object> toOrderDetail(Order o, List<OrderItem> items) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", o.getId());
        map.put("total_amount", o.getTotalAmount());
        map.put("actual_amount", o.getActualAmount());
        map.put("currency", o.getCurrency());
        map.put("status", o.getStatus().name());
        map.put("order_type", o.getOrderType().name());
        map.put("payment_method", o.getPaymentMethod());
        map.put("created_at", o.getCreatedAt());
        map.put("email", o.getEmail());
        map.put("contact_type", o.getContactType());
        map.put("contact_value", o.getContactValue());
        map.put("has_query_password", o.getQueryPasswordHash() != null && !o.getQueryPasswordHash().isBlank());
        map.put("points_deducted", o.getPointsDeducted());
        map.put("points_discount", o.getPointsDiscount());
        map.put("expires_at", o.getExpiresAt());
        map.put("paid_at", o.getPaidAt());
        map.put("delivered_at", o.getDeliveredAt());
        map.put("items", items.stream().map(i -> {
            Map<String, Object> im = new LinkedHashMap<>();
            im.put("id", i.getId());
            im.put("product_id", i.getProductId());
            im.put("product_title", i.getProductTitle());
            im.put("spec_name", i.getSpecName());
            im.put("quantity", i.getQuantity());
            im.put("unit_price", i.getUnitPrice());
            im.put("subtotal", i.getSubtotal());
            im.put("currency", o.getCurrency());
            return im;
        }).toList());
        return map;
    }

    /**
     * F18: 规格模式安全校验
     * - specEnabled=true 且有规格时，必须提供 spec_id（防止跨池分配卡密）
     * - specEnabled=false 时，不允许传 spec_id（防止绕过模式获取规格价格）
     */
    private void validateSpecConsistency(Product product, UUID specId) {
        if (product.isSpecEnabled()) {
            List<ProductSpec> activeSpecs = productSpecRepository
                    .findByProductIdAndIsDeletedOrderBySortOrderAsc(product.getId(), 0);
            if (!activeSpecs.isEmpty() && specId == null) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "该商品需要选择规格");
            }
        } else {
            if (specId != null) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "该商品不支持规格选择");
            }
        }
    }

    /**
     * 支付渠道前置校验 — 在订单落库前确认渠道存在且启用，防止伪造不存在的支付方式绕过后续校验
     */
    private void validatePaymentMethod(String paymentMethod) {
        if (paymentMethod == null || paymentMethod.isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "支付方式不能为空");
        }
        paymentChannelRepository.findByChannelCodeAndIsDeleted(paymentMethod, 0)
                .filter(PaymentChannel::isEnabled)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHANNEL_UNAVAILABLE, "支付渠道不可用"));
    }

    /** 每用户单次最大购买数量，后台可配，兜底 999（配置异常或 ≤ 0 时回退） */
    private int getMaxPurchasePerUser() {
        int val = getConfigInt("max_purchase_per_user", 999);
        return (val > 0 && val <= 999) ? val : 999;
    }

    private int getConfigInt(String key, int defaultValue) {
        return siteConfigRepository.findByConfigKey(key)
                .map(c -> {
                    try { return Integer.parseInt(c.getConfigValue()); }
                    catch (Exception e) { return defaultValue; }
                }).orElse(defaultValue);
    }

    private String normalizeProductCurrency(String currency) {
        return currencyRateService.normalizeCurrency(currency);
    }

    private void validatePurchaseConstraints(Product product, int quantity, UUID userId, String sessionToken) {
        int min = Math.max(1, product.getMinimumPurchaseQuantity());
        if (quantity < min) {
            throw new BusinessException(ErrorCode.PURCHASE_LIMIT_EXCEEDED, "本商品最少购买 " + min + " 件",
                    Map.of("min", min));
        }
        int max = product.getMaximumPurchaseQuantity();
        if (max > 0 && quantity > max) {
            throw new BusinessException(ErrorCode.PURCHASE_LIMIT_EXCEEDED, "本商品单次最多购买 " + max + " 件",
                    Map.of("max", max));
        }
        int perUser = product.getMaximumPurchasePerUser();
        if (perUser <= 0) {
            return;
        }
        long purchased;
        List<OrderStatus> completedStatuses = List.of(OrderStatus.PAID, OrderStatus.DELIVERED);
        if (userId != null) {
            purchased = orderRepository.sumPurchasedQuantityByUser(userId, completedStatuses, product.getId());
        } else if (sessionToken != null && !sessionToken.isBlank()) {
            purchased = orderRepository.sumPurchasedQuantityBySession(sessionToken, completedStatuses, product.getId());
        } else {
            purchased = 0;
        }
        if (purchased + quantity > perUser) {
            throw new BusinessException(ErrorCode.PURCHASE_LIMIT,
                    "该商品累计最多可购买 " + perUser + " 件",
                    Map.of("max", perUser));
        }
    }

    private String normalizeAndValidateContact(String contactType, String contactValue) {
        String normalizedType = normalizeContactType(contactType);
        if (contactValue == null || contactValue.isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "请填写联系方式");
        }
        return switch (normalizedType) {
            case "EMAIL" -> {
                if (!EMAIL_PATTERN.matcher(contactValue).matches()) {
                    throw new BusinessException(ErrorCode.BAD_REQUEST, "邮箱格式不正确");
                }
                yield contactValue.toLowerCase(Locale.ROOT);
            }
            case "PHONE" -> {
                if (!PHONE_PATTERN.matcher(contactValue).matches()) {
                    throw new BusinessException(ErrorCode.BAD_REQUEST, "手机号格式不正确");
                }
                yield contactValue;
            }
            case "QQ" -> {
                if (!QQ_PATTERN.matcher(contactValue).matches()) {
                    throw new BusinessException(ErrorCode.BAD_REQUEST, "QQ 号格式不正确");
                }
                yield contactValue;
            }
            default -> contactValue;
        };
    }

    private void validateQueryPassword(Product product, String queryPassword) {
        if (!product.isQueryPasswordEnabled()) {
            return;
        }
        if (queryPassword == null || queryPassword.length() < 6) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "查询密码至少 6 位");
        }
    }

    private String normalizeContactType(String contactType) {
        if (contactType == null || contactType.isBlank()) {
            return "EMAIL";
        }
        String normalized = contactType.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "EMAIL", "PHONE", "QQ", "TEXT" -> normalized;
            default -> "EMAIL";
        };
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        String normalized = email.trim().toLowerCase(Locale.ROOT);
        if (!EMAIL_PATTERN.matcher(normalized).matches()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "邮箱格式不正确");
        }
        return normalized;
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private CartOrderContext resolveCartOrderContext(List<CartItem> cartItems, UUID userId, String sessionToken,
                                                     String queryPassword) {
        boolean requiresQueryPassword = false;
        for (CartItem item : cartItems) {
            Product product = productRepository.findById(item.getProductId())
                    .filter(p -> p.getIsDeleted() == 0 && p.isEnabled())
                    .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND, "商品不存在或已下架"));
            if (!"EMAIL".equals(normalizeContactType(product.getContactType()))) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "购物车结算暂仅支持邮箱型联系方式商品");
            }
            validatePurchaseConstraints(product, item.getQuantity(), userId, sessionToken);
            requiresQueryPassword = requiresQueryPassword || product.isQueryPasswordEnabled();
        }
        if (requiresQueryPassword && (queryPassword == null || queryPassword.length() < 6)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "该订单包含启用查询密码的商品，请设置至少 6 位查询密码");
        }
        return new CartOrderContext(requiresQueryPassword);
    }

    private record CartOrderContext(boolean requiresQueryPassword) {}
}
