package com.orionkey.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface DeliverService {

    List<?> queryOrders(Map<String, Object> request);

    List<?> deliverOrders(Map<String, Object> request);

    Map<String, Object> unlockOrder(UUID orderId, String queryPassword);

    String exportCardKeys(UUID orderId, String accessToken);
}
