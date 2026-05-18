import type { Locale } from "@/lib/i18n"
import type { CartItem, DeliverResult, DeliverResultGroup, ProductCard, ProductDetail } from "@/types"

type ProductLocaleEntry = {
  ids?: string[]
  aliases: string[]
  translations: Record<Locale, string>
  descriptions?: Partial<Record<Locale, string>>
  detailMd?: Partial<Record<Locale, string>>
}

const PRODUCT_LOCALE_ENTRIES: ProductLocaleEntry[] = [
  {
    ids: ["b0000000-0000-0000-0000-000000000001"],
    aliases: ["通用点卡 50 面值", "Steam 50元钱包充值卡"],
    translations: {
      zh: "通用点卡 50 面值",
      en: "Universal Gift Card 50 Value",
      ja: "汎用ギフトカード 50額面",
      ko: "범용 기프트카드 50 액면가",
      es: "Tarjeta regalo universal valor 50",
      fr: "Carte cadeau universelle valeur 50",
      de: "Universal-Geschenkkarte Wert 50",
    },
    descriptions: {
      en: "Instantly delivered 50-value digital gift card for common top-up scenarios.",
      ja: "一般的なチャージ用途に使える50額面のデジタルギフトカードです。自動で即時配送されます。",
      ko: "일반 충전에 사용할 수 있는 50 액면가 디지털 기프트카드입니다. 자동으로 즉시 발송됩니다.",
      es: "Tarjeta regalo digital de valor 50 para recargas comunes, con entrega automática inmediata.",
      fr: "Carte cadeau numérique valeur 50 pour les recharges courantes, avec livraison automatique instantanée.",
      de: "Digitale Geschenkkarte im Wert von 50 für gängige Aufladungen, mit sofortiger automatischer Lieferung.",
    },
    detailMd: {
      en: "## Product Overview\nThis product delivers a 50-value digital card automatically after payment.\n\n## Delivery Notes\n- Instant delivery after successful payment\n- Order can be retrieved by email\n- Suitable for self-service digital top-up sales",
      ja: "## 商品概要\n決済完了後に50額面のデジタルカードを自動配送します。\n\n## 配送について\n- 支払い完了後すぐに自動配信\n- メールで注文を再確認可能\n- デジタルチャージ商品の販売に適しています",
      ko: "## 상품 개요\n결제 완료 후 50 액면가 디지털 카드를 자동 발송합니다.\n\n## 발송 안내\n- 결제 성공 후 즉시 자동 발송\n- 이메일로 주문 재조회 가능\n- 디지털 충전 상품 판매에 적합",
      es: "## Resumen del producto\nTras el pago se entrega automáticamente una tarjeta digital de valor 50.\n\n## Entrega\n- Entrega automática tras el pago\n- El pedido puede recuperarse por correo\n- Ideal para ventas de recargas digitales",
      fr: "## Présentation du produit\nUne carte numérique valeur 50 est livrée automatiquement après le paiement.\n\n## Livraison\n- Livraison automatique après paiement\n- La commande peut être retrouvée par e-mail\n- Convient à la vente de recharges numériques",
      de: "## Produktübersicht\nNach erfolgreicher Zahlung wird automatisch eine digitale Karte im Wert von 50 geliefert.\n\n## Lieferung\n- Sofortige automatische Zustellung nach Zahlung\n- Bestellung per E-Mail wieder abrufbar\n- Geeignet für den Verkauf digitaler Aufladungen",
    },
  },
  {
    ids: ["b0000000-0000-0000-0000-000000000002"],
    aliases: ["通用点卡 100 面值"],
    translations: {
      zh: "通用点卡 100 面值",
      en: "Universal Gift Card 100 Value",
      ja: "汎用ギフトカード 100額面",
      ko: "범용 기프트카드 100 액면가",
      es: "Tarjeta regalo universal valor 100",
      fr: "Carte cadeau universelle valeur 100",
      de: "Universal-Geschenkkarte Wert 100",
    },
    descriptions: {
      en: "Higher-value 100 digital gift card for users needing larger one-time top-ups.",
      ja: "より高額なチャージ向けの100額面デジタルギフトカードです。",
      ko: "더 큰 금액 충전에 적합한 100 액면가 디지털 기프트카드입니다.",
      es: "Tarjeta digital de valor 100 para recargas de mayor importe.",
      fr: "Carte numérique valeur 100 pour des recharges d'un montant plus élevé.",
      de: "Digitale Karte im Wert von 100 für größere einmalige Aufladungen.",
    },
  },
  {
    ids: ["b0000000-0000-0000-0000-000000000003"],
    aliases: ["专业版软件授权码", "Windows 11 Pro 专业版激活码"],
    translations: {
      zh: "专业版软件授权码",
      en: "Professional Software License Key",
      ja: "プロ版ソフトウェアライセンスキー",
      ko: "프로 버전 소프트웨어 라이선스 키",
      es: "Clave de licencia de software profesional",
      fr: "Clé de licence logicielle Professionnelle",
      de: "Software-Lizenzschlüssel Professional",
    },
    descriptions: {
      en: "Professional software activation key with automatic delivery and quick order lookup.",
      ja: "自動配送と簡単な注文確認に対応したプロ版ソフトウェアのライセンスキーです。",
      ko: "자동 발송과 빠른 주문 조회를 지원하는 프로 버전 소프트웨어 라이선스 키입니다.",
      es: "Clave de activación profesional con entrega automática y consulta rápida del pedido.",
      fr: "Clé d'activation professionnelle avec livraison automatique et consultation rapide de la commande.",
      de: "Professioneller Aktivierungsschlüssel mit automatischer Lieferung und schneller Bestellabfrage.",
    },
    detailMd: {
      en: "## License Delivery\nThe activation key is delivered automatically after payment.\n\n## Usage Notes\n- Please verify the edition before purchase\n- Delivered keys should be stored securely\n- If you lose the key, recover the order by email",
      ja: "## ライセンス配送\n決済完了後にアクティベーションキーを自動配信します。\n\n## ご利用上の注意\n- 購入前にエディションをご確認ください\n- 配送されたキーは安全に保管してください\n- 紛失時はメールで注文を再取得できます",
      ko: "## 라이선스 발송\n결제 완료 후 활성화 키가 자동 발송됩니다.\n\n## 이용 안내\n- 구매 전 에디션을 확인하세요\n- 발급된 키는 안전하게 보관하세요\n- 분실 시 이메일로 주문을 다시 조회할 수 있습니다",
      es: "## Entrega de licencia\nLa clave se entrega automáticamente después del pago.\n\n## Notas de uso\n- Verifica la edición antes de comprar\n- Guarda la clave en un lugar seguro\n- Si la pierdes, recupera el pedido por correo",
      fr: "## Livraison de licence\nLa clé d'activation est livrée automatiquement après paiement.\n\n## Conseils d'utilisation\n- Vérifiez l'édition avant l'achat\n- Conservez la clé en lieu sûr\n- En cas de perte, retrouvez la commande par e-mail",
      de: "## Lizenzbereitstellung\nDer Aktivierungsschlüssel wird nach der Zahlung automatisch zugestellt.\n\n## Hinweise\n- Edition vor dem Kauf prüfen\n- Schlüssel sicher aufbewahren\n- Bei Verlust Bestellung per E-Mail wiederfinden",
    },
  },
  {
    ids: ["b0000000-0000-0000-0000-000000000004"],
    aliases: ["办公套件年度订阅", "Office 365 家庭版年卡"],
    translations: {
      zh: "办公套件年度订阅",
      en: "Office Suite Annual Subscription",
      ja: "オフィススイート年間サブスクリプション",
      ko: "오피스 스위트 연간 구독",
      es: "Suscripción anual de suite ofimática",
      fr: "Abonnement annuel à la suite bureautique",
      de: "Jahresabo für Office-Suite",
    },
    descriptions: {
      en: "Annual office suite subscription suitable for long-term productivity usage.",
      ja: "長期利用向けのオフィススイート年間サブスクリプションです。",
      ko: "장기 사용에 적합한 오피스 스위트 연간 구독입니다.",
      es: "Suscripción anual de suite ofimática para uso productivo a largo plazo.",
      fr: "Abonnement annuel à une suite bureautique, idéal pour un usage longue durée.",
      de: "Jahresabo für eine Office-Suite, geeignet für langfristige Nutzung.",
    },
  },
  {
    ids: ["b0000000-0000-0000-0000-000000000005"],
    aliases: ["影音会员月卡", "Netflix 高级会员月卡", "YouTube Premium 会员月卡"],
    translations: {
      zh: "影音会员月卡",
      en: "Streaming Membership Monthly Pass",
      ja: "動画配信メンバー月間パス",
      ko: "스트리밍 멤버십 월간 이용권",
      es: "Pase mensual de suscripción de streaming",
      fr: "Pass mensuel d'abonnement streaming",
      de: "Streaming-Mitgliedschaft Monatskarte",
    },
    descriptions: {
      en: "Monthly streaming membership product with automated fulfillment after payment.",
      ja: "決済後に自動提供される動画配信サービス向け月額商品です。",
      ko: "결제 후 자동 제공되는 스트리밍 월간 멤버십 상품입니다.",
      es: "Producto de suscripción mensual de streaming con entrega automática tras el pago.",
      fr: "Produit d'abonnement mensuel de streaming avec traitement automatique après paiement.",
      de: "Monatliches Streaming-Mitgliedschaftsprodukt mit automatischer Bereitstellung nach Zahlung.",
    },
  },
  {
    ids: ["b0000000-0000-0000-0000-000000000006"],
    aliases: ["音乐会员季卡", "Spotify Premium 会员季卡"],
    translations: {
      zh: "音乐会员季卡",
      en: "Music Membership Quarterly Pass",
      ja: "音楽メンバー四半期パス",
      ko: "음악 멤버십 분기 이용권",
      es: "Pase trimestral de membresía musical",
      fr: "Pass trimestriel d'abonnement musical",
      de: "Musik-Mitgliedschaft Quartalskarte",
    },
    descriptions: {
      en: "Quarterly music membership option for users who prefer longer subscription cycles.",
      ja: "より長い契約期間を希望する方向けの音楽サービス四半期プランです。",
      ko: "더 긴 이용 기간을 원하는 사용자를 위한 음악 서비스 분기 플랜입니다.",
      es: "Opción trimestral de membresía musical para ciclos de suscripción más largos.",
      fr: "Option trimestrielle d'abonnement musical pour les utilisateurs recherchant une durée plus longue.",
      de: "Vierteljährliche Musik-Mitgliedschaft für längere Abonnementlaufzeiten.",
    },
  },
  {
    aliases: ["ChatGPT Plus 月卡"],
    translations: {
      zh: "ChatGPT Plus 月卡",
      en: "ChatGPT Plus Monthly Pass",
      ja: "ChatGPT Plus 月間パス",
      ko: "ChatGPT Plus 월간 이용권",
      es: "Pase mensual de ChatGPT Plus",
      fr: "Pass mensuel ChatGPT Plus",
      de: "ChatGPT Plus Monatskarte",
    },
    descriptions: {
      en: "Monthly access product for ChatGPT Plus with automated digital fulfillment.",
      ja: "ChatGPT Plus 向けの月間アクセス商品で、自動デジタル配送に対応しています。",
      ko: "ChatGPT Plus용 월간 이용 상품으로 자동 디지털 발송을 지원합니다.",
      es: "Producto de acceso mensual a ChatGPT Plus con entrega digital automática.",
      fr: "Produit d'accès mensuel à ChatGPT Plus avec livraison numérique automatique.",
      de: "Monatliches Zugangsprodukt für ChatGPT Plus mit automatischer digitaler Zustellung.",
    },
  },
  {
    aliases: ["Discord Nitro 月卡"],
    translations: {
      zh: "Discord Nitro 月卡",
      en: "Discord Nitro Monthly Pass",
      ja: "Discord Nitro 月間パス",
      ko: "Discord Nitro 월간 이용권",
      es: "Pase mensual de Discord Nitro",
      fr: "Pass mensuel Discord Nitro",
      de: "Discord Nitro Monatskarte",
    },
    descriptions: {
      en: "Monthly Discord Nitro membership item delivered automatically after payment.",
      ja: "決済後に自動配送される Discord Nitro 月間メンバーシップ商品です。",
      ko: "결제 후 자동 발송되는 Discord Nitro 월간 멤버십 상품입니다.",
      es: "Artículo de membresía mensual de Discord Nitro con entrega automática tras el pago.",
      fr: "Produit d'abonnement mensuel Discord Nitro avec livraison automatique après paiement.",
      de: "Monatliches Discord-Nitro-Produkt mit automatischer Zustellung nach Zahlung.",
    },
  },
]

const SPEC_TRANSLATIONS: Record<string, Record<Locale, string>> = {
  "50元面额": {
    zh: "50元面额",
    en: "50 CNY Value",
    ja: "50元額面",
    ko: "50위안 액면가",
    es: "Valor de 50 CNY",
    fr: "Valeur 50 CNY",
    de: "Wert 50 CNY",
  },
  "100元面额": {
    zh: "100元面额",
    en: "100 CNY Value",
    ja: "100元額面",
    ko: "100위안 액면가",
    es: "Valor de 100 CNY",
    fr: "Valeur 100 CNY",
    de: "Wert 100 CNY",
  },
  "专业版": {
    zh: "专业版",
    en: "Professional",
    ja: "プロ版",
    ko: "프로 버전",
    es: "Profesional",
    fr: "Professionnel",
    de: "Professional",
  },
  "企业版": {
    zh: "企业版",
    en: "Enterprise",
    ja: "エンタープライズ版",
    ko: "엔터프라이즈",
    es: "Empresarial",
    fr: "Entreprise",
    de: "Enterprise",
  },
  "家庭版": {
    zh: "家庭版",
    en: "Home",
    ja: "家庭版",
    ko: "가정용",
    es: "Hogar",
    fr: "Famille",
    de: "Home",
  },
  "月卡": {
    zh: "月卡",
    en: "Monthly",
    ja: "月間",
    ko: "월간",
    es: "Mensual",
    fr: "Mensuel",
    de: "Monatlich",
  },
  "季卡": {
    zh: "季卡",
    en: "Quarterly",
    ja: "四半期",
    ko: "분기",
    es: "Trimestral",
    fr: "Trimestriel",
    de: "Vierteljährlich",
  },
  "年卡": {
    zh: "年卡",
    en: "Annual",
    ja: "年間",
    ko: "연간",
    es: "Anual",
    fr: "Annuel",
    de: "Jährlich",
  },
}

function normalizeText(value?: string | null) {
  return value?.trim().toLowerCase() ?? ""
}

function findProductEntry(productId?: string | null, title?: string | null) {
  const normalizedTitle = normalizeText(title)
  return PRODUCT_LOCALE_ENTRIES.find((entry) => {
    if (productId && entry.ids?.includes(productId)) return true
    return entry.aliases.some((alias) => normalizeText(alias) === normalizedTitle)
  })
}

export function localizeProductTitle(input: {
  locale: Locale
  productId?: string | null
  title?: string | null
}) {
  if (input.locale === "zh") return input.title ?? ""
  const entry = findProductEntry(input.productId, input.title)
  return entry?.translations[input.locale] || input.title || ""
}

export function localizeSpecName(specName: string | null | undefined, locale: Locale) {
  if (!specName) return specName ?? null
  return SPEC_TRANSLATIONS[specName]?.[locale] || specName
}

export function localizeProductCard<T extends ProductCard>(product: T, locale: Locale): T {
  const entry = findProductEntry(product.id, product.title)
  return {
    ...product,
    title: localizeProductTitle({ locale, productId: product.id, title: product.title }),
    description: locale === "zh" ? product.description : entry?.descriptions?.[locale] || product.description,
  }
}

export function localizeProductDetail(product: ProductDetail, locale: Locale): ProductDetail {
  const entry = findProductEntry(product.id, product.title)
  return {
    ...localizeProductCard(product, locale),
    detail_md: locale === "zh" ? product.detail_md : entry?.detailMd?.[locale] || product.detail_md,
    specs: product.specs.map((spec) => ({
      ...spec,
      name: localizeSpecName(spec.name, locale) ?? spec.name,
    })),
  }
}

export function localizeCartItem(item: CartItem, locale: Locale): CartItem {
  return {
    ...item,
    product_title: localizeProductTitle({ locale, productId: item.product_id, title: item.product_title }),
    spec_name: localizeSpecName(item.spec_name, locale),
  }
}

export function localizeDeliverGroup(group: DeliverResultGroup, locale: Locale): DeliverResultGroup {
  return {
    ...group,
    product_title: localizeProductTitle({ locale, title: group.product_title }),
    spec_name: localizeSpecName(group.spec_name, locale),
  }
}

export function localizeDeliverResult(deliver: DeliverResult, locale: Locale): DeliverResult {
  return {
    ...deliver,
    groups: deliver.groups.map((group) => localizeDeliverGroup(group, locale)),
  }
}
