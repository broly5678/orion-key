import type { Locale } from "@/lib/i18n"
import type { SiteConfig } from "@/types"

type SiteField = "site_name" | "site_slogan" | "site_description" | "footer_text" | "announcement" | "popup_content" | "maintenance_message"

type SiteEntry = {
  field: SiteField
  aliases: string[]
  translations: Record<Locale, string>
}

const SITE_ENTRIES: SiteEntry[] = [
  {
    field: "site_name",
    aliases: ["FK Shop", "FK商店", "FK 商店"],
    translations: {
      zh: "FK 商店",
      en: "FK Shop",
      ja: "FKショップ",
      ko: "FK 스토어",
      es: "Tienda FK",
      fr: "Boutique FK",
      de: "FK Shop",
    },
  },
  {
    field: "site_slogan",
    aliases: ["数字商品自动发货", "Digital Delivery"],
    translations: {
      zh: "数字商品自动发货",
      en: "Automated Digital Delivery",
      ja: "デジタル商品の自動配信",
      ko: "디지털 상품 자동 발송",
      es: "Entrega automática de productos digitales",
      fr: "Livraison automatique de produits numériques",
      de: "Automatische Lieferung digitaler Produkte",
    },
  },
  {
    field: "site_description",
    aliases: [
      "自助下单，自动交付，支持常见数字商品销售场景",
      "Digital goods ordering and automated delivery platform",
    ],
    translations: {
      zh: "自助下单，自动交付，支持常见数字商品销售场景",
      en: "Self-service ordering and automated delivery for common digital product sales.",
      ja: "セルフ注文と自動配信に対応した、定番デジタル商品販売向けプラットフォームです。",
      ko: "셀프 주문과 자동 전달을 지원하는 디지털 상품 판매 플랫폼입니다.",
      es: "Plataforma de autoservicio y entrega automática para la venta habitual de productos digitales.",
      fr: "Plateforme de commande autonome et de livraison automatique pour les ventes courantes de produits numériques.",
      de: "Plattform für Self-Service-Bestellungen und automatische Lieferung gängiger digitaler Produkte.",
    },
  },
  {
    field: "footer_text",
    aliases: ["FK Shop", "FK商店", "FK 商店"],
    translations: {
      zh: "FK 商店",
      en: "FK Shop",
      ja: "FKショップ",
      ko: "FK 스토어",
      es: "Tienda FK",
      fr: "Boutique FK",
      de: "FK Shop",
    },
  },
  {
    field: "announcement",
    aliases: ["欢迎使用 FK Shop"],
    translations: {
      zh: "欢迎使用 FK Shop",
      en: "Welcome to FK Shop",
      ja: "FKショップへようこそ",
      ko: "FK 스토어에 오신 것을 환영합니다",
      es: "Bienvenido a FK Shop",
      fr: "Bienvenue sur FK Shop",
      de: "Willkommen bei FK Shop",
    },
  },
  {
    field: "popup_content",
    aliases: ["请先完善站点设置、商品信息与支付渠道后再正式运营。"],
    translations: {
      zh: "请先完善站点设置、商品信息与支付渠道后再正式运营。",
      en: "Please complete your site settings, product information, and payment channels before going live.",
      ja: "正式運営の前に、サイト設定・商品情報・決済チャネルを先に整備してください。",
      ko: "정식 운영 전에 사이트 설정, 상품 정보, 결제 채널을 먼저 완성하세요.",
      es: "Completa primero la configuración del sitio, la información de los productos y los canales de pago antes de lanzar la tienda.",
      fr: "Veuillez finaliser les paramètres du site, les informations produit et les canaux de paiement avant la mise en ligne.",
      de: "Bitte vervollständigen Sie zuerst die Website-Einstellungen, Produktinformationen und Zahlungskanäle, bevor Sie live gehen.",
    },
  },
  {
    field: "maintenance_message",
    aliases: ["系统正在升级维护中，请稍后再来。给您带来不便，敬请谅解。"],
    translations: {
      zh: "系统正在升级维护中，请稍后再来。给您带来不便，敬请谅解。",
      en: "The system is currently under maintenance. Please come back later.",
      ja: "現在システムメンテナンス中です。しばらくしてから再度お試しください。",
      ko: "현재 시스템 점검 중입니다. 잠시 후 다시 방문해 주세요.",
      es: "El sistema está en mantenimiento. Vuelve a intentarlo más tarde.",
      fr: "Le système est en maintenance. Veuillez réessayer plus tard.",
      de: "Das System wird gewartet. Bitte versuchen Sie es später erneut.",
    },
  },
]

function normalizeText(value?: string | null) {
  return value?.trim().toLowerCase() ?? ""
}

export function localizeSiteField(field: SiteField, value: string | undefined, locale: Locale) {
  if (!value) return value ?? ""
  if (locale === "zh") return value
  const normalized = normalizeText(value)
  const entry = SITE_ENTRIES.find((item) => item.field === field && item.aliases.some((alias) => normalizeText(alias) === normalized))
  return entry?.translations[locale] || value
}

export function localizeSiteConfigValue(config: SiteConfig | null | undefined, field: SiteField, locale: Locale) {
  if (!config) return ""
  return localizeSiteField(field, config[field], locale)
}
