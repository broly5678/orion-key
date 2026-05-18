package com.orionkey.controller;

import com.orionkey.service.WebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/payments/webhook")
@RequiredArgsConstructor
public class PaymentWebhookController {

    private final WebhookService webhookService;

    /**
     * 易支付 GET callback — returns plain text "SUCCESS"
     */
    @GetMapping(value = "/epay", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> handleEpayCallback(@RequestParam Map<String, String> params) {
        log.info("Epay callback received: {}", params);
        String result = webhookService.processEpayCallback(params);
        return ResponseEntity.ok(result);
    }

    /**
     * BEpusdt USDT 支付回调 — POST JSON，返回 "ok" 表示成功
     */
    @PostMapping(value = "/usdt", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> handleBepusdtCallback(@RequestBody Map<String, Object> params) {
        log.info("BEpusdt callback received: {}", params);
        String result = webhookService.processBepusdtCallback(params);
        return ResponseEntity.ok(result);
    }

    @RequestMapping(value = "/alipay", method = {RequestMethod.GET, RequestMethod.POST}, produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> handleNativeAlipayCallback(@RequestParam Map<String, String> params) {
        String result = webhookService.processNativeAlipayCallback(params);
        if (!"success".equalsIgnoreCase(result)) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping(value = "/wxpay", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> handleNativeWxpayCallback(
            @RequestBody String payload,
            @RequestHeader Map<String, String> headers) {
        String result = webhookService.processNativeWxpayCallback(payload, headers);
        Map<String, String> body = new LinkedHashMap<>();
        if (!"ok".equalsIgnoreCase(result)) {
            body.put("code", "FAIL");
            body.put("message", "失败");
            return ResponseEntity.status(500).body(body);
        }
        body.put("code", "SUCCESS");
        body.put("message", "成功");
        return ResponseEntity.ok(body);
    }

    @PostMapping(value = "/stripe", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> handleStripeCallback(
            @RequestBody String payload,
            @RequestHeader(value = "Stripe-Signature", required = false) String signatureHeader) {
        String result = webhookService.processStripeCallback(payload, signatureHeader);
        if (!"ok".equalsIgnoreCase(result)) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping(value = "/paypal", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> handlePaypalCallback(
            @RequestBody String payload,
            @RequestHeader Map<String, String> headers) {
        String result = webhookService.processPaypalCallback(payload, headers);
        if (!"ok".equalsIgnoreCase(result)) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }
}
