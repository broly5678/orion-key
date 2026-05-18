"use client"

import Link from "next/link"
import { Zap, Package, AlertTriangle, Lock, Mail, Phone, MessageCircleMore } from "lucide-react"
import type { ProductCard as ProductCardType } from "@/types"
import { useLocale } from "@/lib/context"
import { formatStorefrontPrice } from "@/lib/storefront-currency"
import { cn } from "@/lib/utils"

interface ProductCardProps {
  product: ProductCardType
}

export function ProductCard({ product }: ProductCardProps) {
  const { t, locale } = useLocale()

  const inStock = product.stock_available > 0
  const hideInventory = product.inventory_hidden === true
  const lowStock = !hideInventory && product.stock_available > 0 && product.stock_available <= 10

  const stockBarColor = !inStock
    ? "bg-destructive/70"
    : lowStock
      ? "bg-amber-500"
      : "bg-emerald-500"

  const productUrl = `/product/${product.id}`
  const contactBadge = {
    EMAIL: { icon: Mail, label: "邮箱取货" },
    PHONE: { icon: Phone, label: "手机号下单" },
    QQ: { icon: MessageCircleMore, label: "QQ 下单" },
    TEXT: { icon: MessageCircleMore, label: "联系方式下单" },
  }[product.contact_type || "EMAIL"]

  return (
    <div className="group/card relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-lg hover:shadow-black/5">
      {/* Image */}
      <Link
        href={productUrl}
        className="relative block aspect-[4/3.2] cursor-pointer bg-muted"
      >
        {product.cover_url ? (
          <img
            src={product.cover_url || "/placeholder.svg"}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-300 will-change-transform hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Package className="h-8 w-8 text-muted-foreground/20" />
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {/* Title */}
        <Link href={productUrl}>
          <h3 className="line-clamp-2 cursor-pointer text-[15px] font-bold leading-snug tracking-tight text-card-foreground">
            {product.title}
          </h3>
        </Link>

        {/* Tags row */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {product.delivery_type !== "MANUAL" && (
              <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                <Zap className="h-3 w-3" />
                {t("home.instantDelivery")}
              </span>
            )}
            {product.query_password_enabled !== false && (
              <span className="inline-flex items-center gap-0.5 rounded bg-sky-100 px-1.5 py-0.5 text-xs font-semibold text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                <Lock className="h-3 w-3" />
                查询密码
              </span>
            )}
            {contactBadge && (
              <span className="inline-flex items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <contactBadge.icon className="h-3 w-3" />
                {contactBadge.label}
              </span>
            )}
            {lowStock && (
              <span className="inline-flex items-center gap-0.5 rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-900/40 dark:text-red-300">
                <AlertTriangle className="h-2.5 w-2.5" />
                {t("home.stock")} {product.stock_available}
              </span>
            )}
            {!inStock && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                {t("home.stock")} 0
              </span>
            )}
            {hideInventory && inStock && (
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                库存充足
              </span>
            )}
          </div>
          {((product.sales_count ?? 0) + (product.initial_sales ?? 0)) > 0 && (
            <span className="text-xs font-semibold text-muted-foreground dark:text-zinc-400">
              {(product.sales_count ?? 0) + (product.initial_sales ?? 0)}+ {t("home.sales")}
            </span>
          )}
        </div>

        {/* Price + Buy Now */}
        <div className="mt-auto flex items-center justify-between border-t border-border/40 pt-2">
          <div className="flex items-baseline gap-0.5">
            <span className="text-xl font-extrabold tracking-tight text-primary">
              {formatStorefrontPrice(product.base_price, product.currency, locale)}
            </span>
            {product.has_specs && (
              <span className="ml-0.5 text-xs text-muted-foreground">
                {t("home.startFrom")}
              </span>
            )}
          </div>
          <Link
            href={productUrl}
            className="scheme-glow inline-flex cursor-pointer items-center rounded-lg bg-primary px-3.5 py-1.5 text-sm font-bold text-primary-foreground transition-all hover:brightness-110"
          >
            {t("product.buyNow")}
          </Link>
        </div>
      </div>

      {/* Stock bar */}
      <div className="h-1 w-full overflow-hidden bg-muted/50">
        <div
          className={cn("h-full transition-all", stockBarColor)}
          style={{
            width: !inStock
              ? "0%"
              : hideInventory
                ? "100%"
                : `${Math.min(Math.round((product.stock_available / 50) * 100), 100)}%`,
          }}
        />
      </div>
    </div>
  )
}
