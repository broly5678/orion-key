import type { Locale } from "@/lib/i18n"
import { getConfiguredCurrencyRate } from "@/lib/utils"

type SupportedCurrency = "CNY" | "USD" | "EUR" | "JPY" | "KRW" | "GBP" | "USDT"

const CURRENCY_TO_CNY: Record<SupportedCurrency, number> = {
  CNY: 1,
  USD: 7.2,
  EUR: 7.8,
  JPY: 0.05,
  KRW: 0.0052,
  GBP: 9.1,
  USDT: 7.2,
}

const LOCALE_CURRENCY_MAP: Record<Locale, SupportedCurrency> = {
  zh: "CNY",
  en: "USD",
  ja: "JPY",
  ko: "KRW",
  es: "EUR",
  fr: "EUR",
  de: "EUR",
}

const LOCALE_FORMAT_MAP: Record<Locale, string> = {
  zh: "zh-CN",
  en: "en-US",
  ja: "ja-JP",
  ko: "ko-KR",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
}

function normalizeCurrency(currency?: string): SupportedCurrency {
  const upper = currency?.toUpperCase()
  if (upper && upper in CURRENCY_TO_CNY) return upper as SupportedCurrency
  return "CNY"
}

function getRateToCny(currency?: string) {
  const normalizedCurrency = normalizeCurrency(currency)
  return getConfiguredCurrencyRate(normalizedCurrency) ?? CURRENCY_TO_CNY[normalizedCurrency]
}

export function getDisplayCurrency(locale: Locale) {
  return LOCALE_CURRENCY_MAP[locale]
}

export function getPaymentSettlementCurrency(paymentMethod: string | undefined, locale: Locale) {
  const method = paymentMethod?.toLowerCase() || ""
  if (method.startsWith("usdt_")) return getDisplayCurrency(locale)
  if (["stripe", "paypal"].includes(method)) return getDisplayCurrency(locale)
  if (["alipay", "wechat", "wxpay"].includes(method)) return "CNY"
  return getDisplayCurrency(locale)
}

export function convertStorefrontAmount(amount: number, sourceCurrency: string | undefined, locale: Locale) {
  const source = normalizeCurrency(sourceCurrency)
  const target = getDisplayCurrency(locale)
  const amountInCny = amount * getRateToCny(source)
  return amountInCny / getRateToCny(target)
}

export function convertAmountBetweenCurrencies(amount: number, sourceCurrency: string | undefined, targetCurrency: string | undefined) {
  const source = normalizeCurrency(sourceCurrency)
  const target = normalizeCurrency(targetCurrency)
  const amountInCny = amount * getRateToCny(source)
  return amountInCny / getRateToCny(target)
}

export function formatExactCurrency(amount: number, currency: string | undefined, locale: Locale) {
  const normalizedCurrency = normalizeCurrency(currency)
  return new Intl.NumberFormat(LOCALE_FORMAT_MAP[locale], {
    style: "currency",
    currency: normalizedCurrency,
    maximumFractionDigits: normalizedCurrency === "JPY" || normalizedCurrency === "KRW" ? 0 : 2,
    minimumFractionDigits: normalizedCurrency === "JPY" || normalizedCurrency === "KRW" ? 0 : 2,
  }).format(amount)
}

export function formatPaymentSettlementPrice(
  amount: number,
  sourceCurrency: string | undefined,
  paymentMethod: string | undefined,
  locale: Locale
) {
  const targetCurrency = getPaymentSettlementCurrency(paymentMethod, locale)
  const converted = convertAmountBetweenCurrencies(amount, sourceCurrency, targetCurrency)
  return formatExactCurrency(converted, targetCurrency, locale)
}

export function formatStorefrontPrice(amount: number, sourceCurrency: string | undefined, locale: Locale) {
  const source = normalizeCurrency(sourceCurrency)
  const target = getDisplayCurrency(locale)
  const converted = convertStorefrontAmount(amount, source, locale)
  const formatted = new Intl.NumberFormat(LOCALE_FORMAT_MAP[locale], {
    style: "currency",
    currency: target,
    maximumFractionDigits: target === "JPY" || target === "KRW" ? 0 : 2,
    minimumFractionDigits: target === "JPY" || target === "KRW" ? 0 : 2,
  }).format(converted)
  return formatted
}
