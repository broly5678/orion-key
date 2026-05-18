"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Trash2, Minus, Plus, ShoppingCart, ArrowRight, Package, Lock, Mail, Phone, MessageCircleMore, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { formatStorefrontPrice } from "@/lib/storefront-currency"
import { localizeCartItem } from "@/lib/storefront-product-i18n"
import { useLocale, useCart } from "@/lib/context"
import { getApiErrorMessage } from "@/services/api"
import { ContactPanel } from "@/components/shared/contact-panel"

export default function CartPage() {
  const { t, locale } = useLocale()
  const router = useRouter()
  const { items, totalAmount, isLoading, updateItem, removeItem } = useCart()
  const localizedItems = useMemo(() => items.map((item) => localizeCartItem(item, locale)), [items, locale])
  const cartSupportsCheckout = useMemo(
    () => localizedItems.every((item) => (item.contact_type || "EMAIL") === "EMAIL"),
    [localizedItems]
  )
  const checkoutNeedsQueryPassword = useMemo(
    () => localizedItems.some((item) => item.query_password_enabled !== false),
    [localizedItems]
  )

  const totalQty = useMemo(() => localizedItems.reduce((s, i) => s + i.quantity, 0), [localizedItems])

  const handleUpdateQuantity = async (itemId: string, qty: number) => {
    try {
      await updateItem(itemId, qty)
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t))
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem(itemId)
      toast.success(t("cart.remove"))
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t))
    }
  }

  const getContactTypeLabel = (contactType?: string) => {
    switch (contactType) {
      case "PHONE":
        return { label: "手机号下单", icon: Phone }
      case "QQ":
        return { label: "QQ 下单", icon: MessageCircleMore }
      case "TEXT":
        return { label: "联系方式下单", icon: MessageCircleMore }
      default:
        return { label: "邮箱取货", icon: Mail }
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 pb-24">
        <h1 className="text-xl font-bold text-foreground">{t("cart.title")}</h1>
        <div className="flex items-center justify-center py-24">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  if (localizedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <ShoppingCart className="mb-4 h-16 w-16 text-muted-foreground/20" />
        <p className="mb-4 text-lg font-medium text-muted-foreground">
          {t("cart.empty")}
        </p>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t("cart.goShopping")}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <h1 className="text-xl font-bold text-foreground">{t("cart.title")}</h1>

      <ContactPanel />

      {/* Items */}
      <div className="flex flex-col gap-3">
        {localizedItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:border-muted-foreground/20 hover:shadow-sm sm:gap-4 sm:p-4"
          >
            {/* Product Image */}
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted sm:h-20 sm:w-20">
              {item.cover_url ? (
                <img
                  src={item.cover_url || "/placeholder.svg"}
                  alt={item.product_title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-6 w-6 text-muted-foreground/30" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Link
                href={`/product/${item.product_id}`}
                className="truncate text-sm font-medium text-card-foreground hover:text-primary transition-colors"
              >
                {item.product_title}
              </Link>
              {item.spec_name && (
                <span className="text-xs text-muted-foreground">{item.spec_name}</span>
              )}
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-foreground">
                  {formatStorefrontPrice(item.unit_price, item.currency, locale)}
                </span>

                {/* Quantity Control */}
                <div className="inline-flex items-center rounded border border-border">
                  <button
                    onClick={() => handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    className="inline-flex h-7 w-7 items-center justify-center text-muted-foreground hover:bg-accent"
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="inline-flex h-7 w-8 items-center justify-center border-x border-border bg-background text-xs text-foreground">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    className="inline-flex h-7 w-7 items-center justify-center text-muted-foreground hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
                    disabled={item.stock_available != null && item.quantity >= item.stock_available}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                {item.stock_available != null && item.quantity > item.stock_available && (
                  <p className="text-xs text-destructive">{t("product.stockInsufficient")}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(() => {
                  const contactMeta = getContactTypeLabel(item.contact_type)
                  const ContactIcon = contactMeta.icon
                  return (
                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <ContactIcon className="h-3 w-3" />
                      {contactMeta.label}
                    </span>
                  )
                })()}
                {item.query_password_enabled !== false && (
                  <span className="inline-flex items-center gap-1 rounded bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                    <Lock className="h-3 w-3" />
                    需查询密码
                  </span>
                )}
                {item.maximum_purchase_quantity && item.maximum_purchase_quantity > 0 && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    单次最多 {item.maximum_purchase_quantity} 件
                  </span>
                )}
              </div>
            </div>

            {/* Subtotal & Remove */}
            <div className="flex flex-col items-end gap-2">
              <span className="text-sm font-bold text-foreground">
                {formatStorefrontPrice(item.subtotal, item.currency, locale)}
              </span>
              <button
                onClick={() => handleRemoveItem(item.id)}
                className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label={t("cart.remove")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">购物车规则提示</p>
        <p className="mt-1">购物车结算当前仅支持邮箱型商品。手机号、QQ、通用联系方式商品请直接在商品页立即购买。</p>
        {checkoutNeedsQueryPassword && (
          <p className="mt-1">本次购物车中存在启用查询密码的商品，结算时请设置至少 6 位查询密码，支付完成后查单还需再次输入。</p>
        )}
        {!cartSupportsCheckout && (
          <p className="mt-2 inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5" />
            当前购物车包含非邮箱型商品，已禁用结算按钮。
          </p>
        )}
      </div>

      {/* Checkout Bar - fixed bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm shadow-lg">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="text-sm text-muted-foreground">
            {t("cart.selected")} <span className="font-semibold text-foreground">{totalQty}</span>{" "}
            {t("cart.items")}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-sm text-muted-foreground">{t("cart.total")}:</span>
              <span className="ml-2 text-xl font-bold text-foreground">
                {formatStorefrontPrice(totalAmount, localizedItems[0]?.currency, locale)}
              </span>
            </div>
            <button
              onClick={() => {
                if (localizedItems.length === 0) return
                router.push("/checkout")
              }}
              disabled={localizedItems.length === 0 || !cartSupportsCheckout}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {t("cart.checkout")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
