package com.orionkey.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "products")
public class Product extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String detailMd;

    private String coverUrl;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal basePrice;

    @Column(length = 10)
    private String currency = "CNY";

    @Column(nullable = false)
    private UUID categoryId;

    @Column(length = 10)
    private String deliveryType = "AUTO";

    @Column(length = 20)
    private String contactType = "EMAIL";

    @Column(name = "query_password_enabled", nullable = false)
    private boolean queryPasswordEnabled = true;

    @Column(columnDefinition = "TEXT")
    private String leaveMessage;

    @Column(name = "minimum_purchase_quantity")
    private int minimumPurchaseQuantity = 1;

    @Column(name = "maximum_purchase_quantity")
    private int maximumPurchaseQuantity = 0;

    @Column(name = "maximum_purchase_per_user")
    private int maximumPurchasePerUser = 0;

    @Column(name = "only_for_logged_in_users", nullable = false)
    private boolean onlyForLoggedInUsers = false;

    @Column(name = "inventory_hidden", nullable = false)
    private boolean inventoryHidden = false;

    private int lowStockThreshold = 10;

    private boolean wholesaleEnabled = false;

    @Column(name = "spec_enabled", columnDefinition = "boolean not null default false")
    private boolean specEnabled = false;

    @Column(name = "is_enabled")
    private boolean enabled = true;

    @Column(columnDefinition = "INTEGER DEFAULT 0")
    private int initialSales = 0;

    private int sortOrder = 0;

    private int isDeleted = 0;
}
