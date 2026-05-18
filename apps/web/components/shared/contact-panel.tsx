"use client"

import { HelpCircle } from "lucide-react"
import { useLocale, useSiteConfig } from "@/lib/context"
import { ContactLinks } from "@/components/shared/contact-links"

export function ContactPanel() {
  const { t } = useLocale()
  const { config } = useSiteConfig()

  const hasContacts =
    (config?.contact_email_enabled && config?.contact_email) ||
    (config?.contact_qq_enabled && config?.contact_qq) ||
    (config?.contact_qq_group_enabled && config?.contact_qq_group) ||
    (config?.contact_wechat_enabled && config?.contact_wechat) ||
    (config?.contact_wechat_group_enabled && config?.contact_wechat_group) ||
    (config?.contact_telegram_enabled && config?.contact_telegram) ||
    (config?.contact_telegram_group_enabled && config?.contact_telegram_group) ||
    (config?.contact_whatsapp_enabled && config?.contact_whatsapp) ||
    (config?.contact_x_enabled && config?.contact_x)

  if (!hasContacts) return null

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        <HelpCircle className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium text-foreground">{t("order.needHelp")}</p>
      </div>
      <ContactLinks contentMode="both" />
    </div>
  )
}
