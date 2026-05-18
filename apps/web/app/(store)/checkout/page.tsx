"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ShoppingBag, Mail, CreditCard, Lock, AlertTriangle, Package } from "lucide-react"
import { toast } from "sonner"
import { useLocale, useCart } from "@/lib/context"
import { formatPaymentSettlementPrice } from "@/lib/storefront-currency"
import { localizeCartItem } from "@/lib/storefront-product-i18n"
import { orderApi, paymentApi, withMockFallback, getApiErrorMessage } from "@/services/api"
import { mockPaymentChannels, mockCreateOrder } from "@/lib/mock-data"
import { validateEmail, generateIdempotencyKey, detectPaymentDevice, isMobileDevice } from "@/lib/utils"
import { PaymentSelector } from "@/components/shared/payment-selector"
import { ContactPanel } from "@/components/shared/contact-panel"
import { Turnstile, useTurnstile } from "@/components/shared/turnstile"
import { setTurnstileHeaders } from "@/services/api"
import type { PaymentChannelItem } from "@/types"

export default function CheckoutPage() {
  const { t, locale } = useLocale()
  const router = useRouter()
  const { items, totalAmount, refreshCart } = useCart()
  const localizedItems = items.map((item) => localizeCartItem(item, locale))
  const cartSupportsCheckout = localizedItems.every((item) => (item.contact_type || "EMAIL") === "EMAIL")
  const requiresQueryPassword = localizedItems.some((item) => item.query_password_enabled !== false)

  const [email, setEmail] = useState("")
  const [queryPassword, setQueryPassword] = useState("")
  const [channels, setChannels] = useState<PaymentChannelItem[]>([])
  const [selectedPayment, setSelectedPayment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const { turnstileToken, setTurnstileToken, handleTurnstileReset } = useTurnstile()

  // Fetch payment channels on mount
  useEffect(() => {
    let cancelled = false
    async function fetchChannels() {
      try {
        const chs = await withMockFallback(
          () => paymentApi.getChannels(),
          () => mockPaymentChannels
        )
        if (!cancelled) {
          const enabled = chs.filter(c => c.is_enabled)
          setChannels(enabled)
          if (enabled.length > 0) setSelectedPayment(enabled[0].channel_code)
        }
      } catch {
        if (!cancelled) {
          setChannels([])
        }
      }
    }
    fetchChannels()
    return () => { cancelled = true }
  }, [locale])

  const handleConfirmOrder = async () => {
    if (!email.trim()) {
      toast.error(t("product.emailRequired"))
      emailInputRef.current?.focus()
      return
    }
    if (!validateEmail(email)) {
      toast.error(t("product.emailInvalid"))
      emailInputRef.current?.focus()
      return
    }
    if (!selectedPayment) {
      toast.error(t("product.paymentMethod"))
      return
    }
    if (!cartSupportsCheckout) {
      toast.error("购物车仅支持邮箱型商品结算，请返回商品页直接购买对应商品")
      return
    }
    if (requiresQueryPassword && queryPassword.trim().length < 6) {
      toast.error("请设置至少 6 位查询密码")
      return
    }

    setSubmitting(true)
    try {
      setTurnstileHeaders(turnstileToken)
      const device = detectPaymentDevice()
      const result = await withMockFallback(
        () => orderApi.createFromCart({
          email,
          query_password: queryPassword,
          payment_method: selectedPayment,
          locale,
          idempotency_key: generateIdempotencyKey(),
          device,
        }),
        () => mockCreateOrder(email, selectedPayment)
      )
      await refreshCart()
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

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <ShoppingBag className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">{t("checkout.title")}</h1>
      </div>

      <div className="space-y-6">
        {/* Order summary */}
        <div className="rounded-lg border border-border bg-background p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">{t("checkout.summary")}</h2>
          <div className="space-y-3">
            {localizedItems.map((item) => (
              <div key={item.id} className="rounded-lg border border-border/60 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.product_title}
                    {item.spec_name ? ` (${item.spec_name})` : ""}
                    {" x"}{item.quantity}
                  </span>
                  <span className="font-medium text-foreground">{formatPaymentSettlementPrice(item.subtotal, item.currency, selectedPayment, locale)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {(item.contact_type || "EMAIL") === "EMAIL" ? "邮箱取货" : "需直接购买"}
                  </span>
                  {item.query_password_enabled !== false && (
                    <span className="rounded bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                      需查询密码
                    </span>
                  )}
                  {item.maximum_purchase_quantity && item.maximum_purchase_quantity > 0 && (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                      单次最多 {item.maximum_purchase_quantity} 件
                    </span>
                  )}
                  {item.maximum_purchase_per_user && item.maximum_purchase_per_user > 0 && (
                    <span className="rounded bg-orange-100 px-2 py-0.5 text-[11px] font-medium text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                      累计限购 {item.maximum_purchase_per_user} 件
                    </span>
                  )}
                </div>
                {item.leave_message && (
                  <p className="mt-2 text-xs text-muted-foreground">{item.leave_message}</p>
                )}
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-base font-medium text-foreground">{t("checkout.totalAmount")}</span>
              <span className="text-2xl font-bold text-primary">
                {formatPaymentSettlementPrice(totalAmount, localizedItems[0]?.currency, selectedPayment, locale)}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">本次订单规则</p>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>购物车结算仅支持邮箱型商品，支付成功后将通过邮箱或查单页取货。</p>
            {requiresQueryPassword && <p>本次订单包含启用查询密码的商品，结算时必须设置至少 6 位查询密码。</p>}
            {!cartSupportsCheckout && (
              <p className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5" />
                当前购物车包含非邮箱型商品，请返回商品页直接购买对应商品。
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="rounded-lg border border-border bg-background p-6">
          <div className="mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">
              {t("product.email")}
            </h2>
          </div>
          <input
            ref={emailInputRef}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("product.emailPlaceholder")}
            className="mb-2 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground">
            {t("product.emailFullHint")}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-background p-6">
          <div className="mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">查询密码</h2>
          </div>
          <input
            type="password"
            value={queryPassword}
            onChange={(e) => setQueryPassword(e.target.value)}
            placeholder="如商品启用了查询密码，请填写至少 6 位"
            className="mb-2 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground">
            {requiresQueryPassword ? "本次订单支付完成后，查单时还需再次输入该密码才能查看发卡信息。" : "如果后续商品启用了查询密码，支付完成后查单时会再次要求输入。"}
          </p>
        </div>

        {/* Payment method */}
        <div className="rounded-lg border border-border bg-background p-6">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">
              {t("product.paymentMethod")}
            </h2>
          </div>
          <PaymentSelector
            channels={channels}
            selected={selectedPayment}
            onSelect={setSelectedPayment}
            preferredCode={channels[0]?.channel_code}
          />
          {selectedPayment.startsWith("usdt_") && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t("payment.usdt.rateHint")}
            </p>
          )}
        </div>

        {/* Security notice */}
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
          <Lock className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="text-xs text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">{t("checkout.securePayment")}</p>
            <p>{t("checkout.securePaymentDesc")}</p>
          </div>
        </div>

        <ContactPanel />

        <Turnstile onSuccess={setTurnstileToken} onError={handleTurnstileReset} className="mb-4" />

        {/* Confirm button */}
        <button
          onClick={handleConfirmOrder}
          disabled={submitting || items.length === 0 || !cartSupportsCheckout}
          className="scheme-glow w-full rounded-lg bg-primary py-3.5 text-base font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:pointer-events-none disabled:opacity-50"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              {t("checkout.processingOrder")}
            </span>
          ) : (
            <>{t("checkout.confirmOrder")} {formatPaymentSettlementPrice(totalAmount, localizedItems[0]?.currency, selectedPayment, locale)}</>
          )}
        </button>
      </div>
    </div>
  )
}
