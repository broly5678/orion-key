import type { Locale } from "./i18n"
import type { PaymentChannelItem } from "@/types"

const DEFAULT_PRIORITY = ["stripe", "paypal", "wechat", "alipay", "usdt_trc20", "usdt_bep20"]

const PAYMENT_PRIORITY_BY_LOCALE: Record<Locale, string[]> = {
  zh: ["wechat", "alipay", "stripe", "paypal", "usdt_trc20", "usdt_bep20"],
  en: ["stripe", "paypal", "wechat", "alipay", "usdt_trc20", "usdt_bep20"],
  ja: ["paypal", "stripe", "wechat", "alipay", "usdt_trc20", "usdt_bep20"],
  ko: ["paypal", "stripe", "wechat", "alipay", "usdt_trc20", "usdt_bep20"],
  es: ["paypal", "stripe", "wechat", "alipay", "usdt_trc20", "usdt_bep20"],
  fr: ["paypal", "stripe", "wechat", "alipay", "usdt_trc20", "usdt_bep20"],
  de: ["paypal", "stripe", "wechat", "alipay", "usdt_trc20", "usdt_bep20"],
}

export function sortPaymentChannelsByLocale(channels: PaymentChannelItem[], locale: Locale) {
  const priority = PAYMENT_PRIORITY_BY_LOCALE[locale] ?? DEFAULT_PRIORITY
  const orderMap = new Map(priority.map((code, index) => [code, index]))

  return [...channels].sort((left, right) => {
    const leftIndex = orderMap.get(left.channel_code) ?? Number.MAX_SAFE_INTEGER
    const rightIndex = orderMap.get(right.channel_code) ?? Number.MAX_SAFE_INTEGER
    if (leftIndex !== rightIndex) return leftIndex - rightIndex
    if (left.sort_order !== right.sort_order) return left.sort_order - right.sort_order
    return left.channel_name.localeCompare(right.channel_name)
  })
}

export function filterPaymentChannelsByLocale(channels: PaymentChannelItem[], locale: Locale) {
  return channels.filter((channel) => {
    const raw = channel.config_data?.supported_locales?.trim()
    if (!raw) return true

    const supportedLocales = raw
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)

    if (supportedLocales.length === 0) return true
    return supportedLocales.includes(locale)
  })
}
