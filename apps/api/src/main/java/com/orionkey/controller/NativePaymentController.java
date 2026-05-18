package com.orionkey.controller;

import com.orionkey.constant.ErrorCode;
import com.orionkey.constant.OrderStatus;
import com.orionkey.entity.Order;
import com.orionkey.entity.PaymentChannel;
import com.orionkey.exception.BusinessException;
import com.orionkey.repository.OrderRepository;
import com.orionkey.repository.PaymentChannelRepository;
import com.orionkey.service.NativeAlipayService;
import com.orionkey.service.impl.PaymentServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/payments/native")
@RequiredArgsConstructor
public class NativePaymentController {

    private final OrderRepository orderRepository;
    private final PaymentChannelRepository paymentChannelRepository;
    private final PaymentServiceImpl paymentService;
    private final NativeAlipayService nativeAlipayService;

    @GetMapping(value = "/alipay/redirect/{orderId}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> redirectToNativeAlipay(@PathVariable UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND, "订单不存在"));
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "订单状态不允许继续支付");
        }
        PaymentChannel channel = paymentChannelRepository
                .findByChannelCodeAndProviderTypeAndIsDeleted(order.getPaymentMethod(), "native_alipay", 0)
                .filter(PaymentChannel::isEnabled)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHANNEL_UNAVAILABLE, "原生支付宝渠道不可用"));

        NativeAlipayService.NativeAlipayConfig config = paymentService.buildNativeAlipayConfig(channel, order.getId());
        String productName = "FK Shop 订单 " + orderId;
        String html = nativeAlipayService.buildWapPayForm(config, orderId.toString(), order.getActualAmount(), productName);
        return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(html);
    }
}
