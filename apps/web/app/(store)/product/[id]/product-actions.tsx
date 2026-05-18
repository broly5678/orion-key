"use client"

import { useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { Zap, Minus, Plus, ShoppingCart, Package, TrendingUp, Lock, ShieldCheck, Mail, Phone, MessageCircleMore } from "lucide-react"
import { toast } from "sonner"
import { useLocale, useCart } from "@/lib/context"
import { formatPaymentSettlementPrice, formatStorefrontPrice } from "@/lib/storefront-currency"
import { orderApi, withMockFallback, getApiErrorMessage, setTurnstileHeaders } from "@/services/api"
import { mockCreateOrder } from "@/lib/mock-data"
import { ContactPanel } from "@/components/shared/contact-panel"
import { Turnstile, useTurnstile } from "@/components/shared/turnstile"
import { cn, validateEmail, generateIdempotencyKey, detectPaymentDevice, isMobileDevice } from "@/lib/utils"
import { PaymentSelector } from "@/components/shared/payment-selector"
import type { ProductDetail, ProductSpec, PaymentChannelItem } from "@/types"

interface ProductActionsProps {
  product: ProductDetail
  channels: PaymentChannelItem[]
}

export function ProductActions({ product, channels }: ProductActionsProps) {
  const { t, locale } = useLocale()
  const { addItem } = useCart()
  const router = useRouter()
  const emailInputRef = useRef<HTMLInputElement>(null)
  const backupEmailInputRef = useRef<HTMLInputElement>(null)

  const enabledChannels = useMemo(
    () => channels.filter(c => c.is_enabled),
    [channels]
  )

  const [selectedSpec, setSelectedSpec] = useState<ProductSpec | null>(
    product.specs?.[0] || null
  )
  const contactType = product.contact_type || "EMAIL"
  const requiresQueryPassword = product.query_password_enabled !== false
  const minQuantity = Math.max(1, product.minimum_purchase_quantity || 1)
  const [quantity, setQuantity] = useState(minQuantity)
  const [contactValue, setContactValue] = useState("")
  const [backupEmail, setBackupEmail] = useState("")
  const [contactError, setContactError] = useState("")
  const [queryPassword, setQueryPassword] = useState("")
  const [selectedPayment, setSelectedPayment] = useState(
    enabledChannels.length > 0 ? enabledChannels[0].channel_code : ""
  )
  const [submitting, setSubmitting] = useState(false)
  const { turnstileToken, setTurnstileToken, handleTurnstileReset } = useTurnstile()

  const currentPrice = selectedSpec ? selectedSpec.price : product.base_price
  const totalPrice = currentPrice * quantity
  const currentStock = selectedSpec?.stock_available ?? product.stock_available ?? 0
  const quantityCeiling = product.maximum_purchase_quantity && product.maximum_purchase_quantity > 0
    ? Math.min(product.maximum_purchase_quantity, currentStock || product.maximum_purchase_quantity)
    : currentStock || minQuantity
  const isOutOfStock = currentStock === 0
  const deliveryType = product.delivery_type === "MANUAL" ? "manual" : "auto"
  const cartSupported = contactType === "EMAIL"

  const contactMeta = {
    EMAIL: { label: t("product.email"), placeholder: t("product.emailPlaceholder"), helper: "支付成功后将通过邮箱或查单页取货", icon: Mail },
    PHONE: { label: "联系方式", placeholder: "请输入手机号", helper: "此商品要求使用手机号下单", icon: Phone },
    QQ: { label: "联系方式", placeholder: "请输入 QQ 号", helper: "此商品要求使用 QQ 号码下单", icon: MessageCircleMore },
    TEXT: { label: "联系方式", placeholder: "请输入联系方式", helper: "请填写商家要求的联系方式", icon: MessageCircleMore },
  }[contactType] || { label: "联系方式", placeholder: "请输入联系方式", helper: "请填写联系方式", icon: MessageCircleMore }

  const validateContact = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return "请填写联系方式"
    if (contactType === "EMAIL" && !validateEmail(trimmed)) return t("product.emailInvalid")
    if (contactType === "PHONE" && !/^1\d{10}$/.test(trimmed)) return "手机号格式不正确"
    if (contactType === "QQ" && !/^[1-9][0-9]{4,11}$/.test(trimmed)) return "QQ 号格式不正确"
    return ""
  }

  const handleContactChange = (value: string) => {
    setContactValue(value)
    setContactError(validateContact(value))
  }

  const handleBuyNow = async () => {
    const currentContactError = validateContact(contactValue)
    if (currentContactError) {
      toast.error(currentContactError)
      emailInputRef.current?.focus()
      emailInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    if (contactType !== "EMAIL" && backupEmail.trim() && !validateEmail(backupEmail.trim())) {
      toast.error(t("product.emailInvalid"))
      backupEmailInputRef.current?.focus()
      return
    }
    if (requiresQueryPassword && queryPassword.trim().length < 6) {
      toast.error("查询密码至少 6 位")
      return
    }
    if (!selectedPayment) {
      toast.error(t("product.paymentMethod"))
      return
    }
    if (product.specs.length > 0 && !selectedSpec) return
    if (isOutOfStock) {
      toast.error(t("product.outOfStock"))
      return
    }

    setSubmitting(true)
    try {
      setTurnstileHeaders(turnstileToken)
      const device = detectPaymentDevice()
      const result = await withMockFallback(
        () => orderApi.create({
          product_id: product.id,
          spec_id: selectedSpec?.id ?? null,
          quantity,
          email: contactType === "EMAIL" ? contactValue.trim() : backupEmail.trim(),
          contact_value: contactValue.trim(),
          query_password: queryPassword,
          payment_method: selectedPayment,
          locale,
          idempotency_key: generateIdempotencyKey(),
          device,
        }),
        () => mockCreateOrder(contactType === "EMAIL" ? contactValue.trim() : backupEmail.trim(), selectedPayment)
      )
      toast.success(t("checkout.processingOrder"))
      const payUrlH5 = result.payment.pay_url || ""
      const qr = result.payment.qrcode_url || result.payment.payment_url || ""
      let payUrl = `/pay/${result.payment.order_id}?method=${selectedPayment}`
      if (qr) payUrl += `&qr=${encodeURIComponent(qr)}`
      if (payUrlH5) payUrl += `&payurl=${encodeURIComponent(payUrlH5)}`
      // USDT 支付额外参数
      if (result.payment.wallet_address) {
        payUrl += `&wallet=${encodeURIComponent(result.payment.wallet_address)}`
        payUrl += `&crypto_amount=${encodeURIComponent(result.payment.crypto_amount || "")}`
        payUrl += `&chain=${encodeURIComponent(result.payment.chain || "")}`
      }
      // 移动端非 USDT 非微信：直接跳转网关支付页，避免中间经过 pay 页面的延迟
      // 导致支付宝 H5 session token 过期（"会话超时"）
      // 微信支付的 jspay 走 JSAPI（需微信浏览器），普通浏览器不能跳转，只能到 pay 页展示二维码
      const isWechat = ["wechat", "wxpay"].includes(selectedPayment.toLowerCase())
      if (isMobileDevice() && payUrlH5 && !selectedPayment.startsWith("usdt_") && !isWechat) {
        sessionStorage.setItem(`pay_redirected_${result.payment.order_id}`, "1")
        window.location.href = payUrlH5
        return
      }
      router.push(payUrl)
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t))
      handleTurnstileReset()
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddToCart = async () => {
    if (product.specs.length > 0 && !selectedSpec) return
    if (isOutOfStock) {
      toast.error(t("product.outOfStock"))
      return
    }
    try {
      await addItem({
        product_id: product.id,
        spec_id: selectedSpec?.id ?? null,
        quantity,
      })
      toast.success(t("product.addToCart"))
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t))
    }
  }

  return (
    <div className="lg:sticky lg:top-4 flex flex-col gap-4">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-foreground">
          {product.title}
        </h1>
      </div>

      {/* Price + Specs + Stock */}
      <div className="rounded-lg border border-border p-4 space-y-4">
        {/* Price row + delivery status */}
        <div className="flex flex-wrap items-baseline justify-between gap-y-2">
          <div className="flex items-baseline gap-3">
            <div className="text-2xl font-extrabold text-primary">
              {selectedPayment
                ? formatPaymentSettlementPrice(currentPrice, product.currency, selectedPayment, locale)
                : formatStorefrontPrice(currentPrice, product.currency, locale)}
            </div>
          </div>

          {/* Delivery status indicator */}
          <div className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1",
            deliveryType === "auto"
              ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20"
              : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
          )}>
            <span className={cn(
              "relative inline-flex h-2 w-2 rounded-full",
              deliveryType === "auto" ? "bg-emerald-500" : "bg-amber-400"
            )}>
              {deliveryType === "auto" && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              )}
            </span>
            <span className={cn(
              "text-xs font-semibold",
              deliveryType === "auto"
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-amber-600 dark:text-amber-300"
            )}>
              {deliveryType === "auto" ? t("product.deliveryAuto") : t("product.deliveryManual")}
            </span>
          </div>
        </div>

        {/* Stock + Sales */}
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Package className="h-3.5 w-3.5" />
            {product.inventory_hidden ? `${t("product.stock")} 充足` : `${t("product.stock")} ${selectedSpec?.stock_available ?? product.stock_available}`}
          </span>
          {((product.sales_count ?? 0) + (product.initial_sales ?? 0)) > 0 && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              {t("product.sold")} {(product.sales_count ?? 0) + (product.initial_sales ?? 0)}
            </span>
          )}
        </div>

        {/* Spec selection */}
        {product.specs && product.specs.length > 1 && (
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              {t("product.selectSpec")}
            </label>
            <div className="flex flex-wrap gap-2">
              {product.specs.map((spec) => (
                <button
                  key={spec.id}
                  onClick={() => {
                    setSelectedSpec(spec)
                    setQuantity(minQuantity)
                  }}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                    selectedSpec?.id === spec.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground hover:border-primary/30"
                  )}
                  disabled={spec.stock_available === 0}
                >
                  {spec.name}
                  {spec.stock_available === 0 && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({t("product.outOfStock")})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <ContactPanel />

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium text-foreground">购买说明</p>
        </div>
        <div className="grid gap-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <contactMeta.icon className="mt-0.5 h-4 w-4 shrink-0 text-foreground/80" />
            <span>{contactMeta.helper}</span>
          </div>
          {requiresQueryPassword && (
            <div className="flex items-start gap-2">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-foreground/80" />
              <span>下单时需设置查询密码，支付完成后查单还需再次输入该密码才能查看卡密。</span>
            </div>
          )}
          <div className="flex items-start gap-2">
            <Package className="mt-0.5 h-4 w-4 shrink-0 text-foreground/80" />
            <span>
              起购 {minQuantity} 件
              {product.maximum_purchase_quantity && product.maximum_purchase_quantity > 0 ? `，单次最多 ${product.maximum_purchase_quantity} 件` : ""}
              {product.maximum_purchase_per_user && product.maximum_purchase_per_user > 0 ? `，每个用户累计最多 ${product.maximum_purchase_per_user} 件` : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Action area */}
      <div className="rounded-lg border border-border p-4 space-y-4">
        {/* Quantity */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            {t("product.quantity")}
          </label>
          <div className="inline-flex items-center rounded-md border border-border">
            <button
              onClick={() => setQuantity(Math.max(minQuantity, quantity - 1))}
              className="inline-flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:bg-accent"
              disabled={quantity <= minQuantity}
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              min={minQuantity}
              max={Math.max(minQuantity, quantityCeiling)}
              value={quantity}
              onChange={(e) => {
                const v = parseInt(e.target.value) || minQuantity
                setQuantity(Math.max(minQuantity, Math.min(v, Math.max(minQuantity, quantityCeiling))))
              }}
              className="h-9 w-16 border-x border-border bg-background text-center text-sm text-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              onClick={() => setQuantity(Math.min(quantity + 1, Math.max(minQuantity, quantityCeiling)))}
              className="inline-flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:bg-accent"
              disabled={quantity >= Math.max(minQuantity, quantityCeiling)}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Contact input */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {contactMeta.label}
          </label>
          <input
            ref={emailInputRef}
            type={contactType === "EMAIL" ? "email" : "text"}
            placeholder={contactMeta.placeholder}
            value={contactValue}
            onChange={(e) => handleContactChange(e.target.value)}
            className={cn(
              "h-10 w-full rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
              contactError ? "border-destructive" : "border-input"
            )}
          />
          <div className="mt-1.5">
            <p className="text-xs text-muted-foreground">
              {contactType === "EMAIL" ? t("product.emailFullHint") : contactMeta.helper}
            </p>
            {contactError && (
              <p className="mt-1 text-xs text-destructive">{contactError}</p>
            )}
          </div>
        </div>

        {contactType !== "EMAIL" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">接收邮箱（可选）</label>
            <input
              ref={backupEmailInputRef}
              type="email"
              placeholder={t("product.emailPlaceholder")}
              value={backupEmail}
              onChange={(e) => setBackupEmail(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">如填写，将用于发货邮件通知和后续找回。</p>
          </div>
        )}

        {requiresQueryPassword && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">查询密码</label>
            <input
              type="password"
              placeholder="请设置至少 6 位查询密码"
              value={queryPassword}
              onChange={(e) => setQueryPassword(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">支付完成后查看卡密时，需要再次输入该密码。</p>
          </div>
        )}

        {/* Payment method */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            {t("product.paymentMethod")}
          </label>
          <PaymentSelector
            channels={enabledChannels}
            selected={selectedPayment}
            onSelect={setSelectedPayment}
            preferredCode={enabledChannels[0]?.channel_code}
          />
        </div>

        {/* Total */}
        <div className="flex items-baseline justify-between border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">{t("product.totalPrice")}</span>
          <div className="text-2xl font-bold text-primary">
            {selectedPayment
              ? formatPaymentSettlementPrice(totalPrice, product.currency, selectedPayment, locale)
              : formatStorefrontPrice(totalPrice, product.currency, locale)}
          </div>
        </div>

        {!cartSupported && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            该商品使用非邮箱联系方式，暂不支持加入购物车，请直接立即购买。
          </div>
        )}
        <Turnstile onSuccess={setTurnstileToken} onError={handleTurnstileReset} className="mb-3" />

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleBuyNow}
            disabled={submitting || isOutOfStock}
            className="scheme-glow inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:pointer-events-none disabled:opacity-50"
          >
            {submitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {isOutOfStock ? t("product.outOfStock") : t("product.buyNow")}
          </button>
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || !cartSupported}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-transparent px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          >
            <ShoppingCart className="h-4 w-4" />
            {t("product.addToCart")}
          </button>
        </div>
      </div>
    </div>
  )
}
