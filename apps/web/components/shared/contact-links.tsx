"use client"

import type { ComponentType, SVGProps } from "react"
import { Mail } from "lucide-react"
import { toast } from "sonner"
import { useLocale, useSiteConfig } from "@/lib/context"
import { cn } from "@/lib/utils"

type ContentMode = "label" | "value" | "both"

interface ContactLinksProps {
  className?: string
  itemClassName?: string
  iconOnly?: boolean
  contentMode?: ContentMode
}

type ContactBehavior =
  | { mode: "link"; href: string; external: boolean }
  | { mode: "copy"; value: string }

interface ContactItem {
  key: string
  label: string
  value: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  iconClassName?: string
  behavior: ContactBehavior
}

function QQIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12.02 2.1c-3.33 0-5.74 2.26-5.74 5.37 0 1.67.58 3.12 1.55 4.15-.17.58-.5 1.31-.95 1.96-.16.23-.03.55.24.63.83.25 1.86.08 2.91-.52.55.18 1.16.29 1.99.29s1.44-.11 1.99-.29c1.05.6 2.08.77 2.9.52.28-.08.41-.4.25-.63-.45-.65-.78-1.38-.95-1.96.97-1.03 1.55-2.48 1.55-4.15 0-3.11-2.41-5.37-5.74-5.37Zm-1.78 12.7h3.56c1.27 0 2.29 1 2.29 2.23 0 .53-.2 1.04-.55 1.44-.38.43-.61.92-.61 1.38 0 1.18-.95 2.15-2.12 2.15-.47 0-.9-.16-1.25-.44A1.94 1.94 0 0 0 10.3 22c-1.17 0-2.12-.97-2.12-2.15 0-.46-.23-.95-.61-1.38-.35-.4-.55-.91-.55-1.44 0-1.23 1.02-2.23 2.22-2.23Z" />
      <path d="M9.45 7.95a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Zm5.1 0a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Z" />
      <path d="M9.9 15.7c-.34 0-.61.29-.58.63.14 1.48 1.34 2.67 2.83 2.67s2.69-1.19 2.83-2.67a.6.6 0 0 0-.59-.63H9.9Z" />
    </svg>
  )
}

function WechatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M9.27 4C5.25 4 2 6.57 2 9.73c0 1.82 1.09 3.43 2.78 4.48L4 17.22l3.2-1.6c.66.13 1.15.18 2.07.18 4.01 0 7.27-2.56 7.27-5.72C16.54 6.57 13.28 4 9.27 4Zm-2.63 4.38a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm5.26 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm4.28 3.07c-3.22 0-5.82 2.07-5.82 4.63 0 1.4.78 2.67 2 3.52L12 22l2.49-1.25c.52.1 1.07.15 1.69.15 3.21 0 5.82-2.07 5.82-4.62 0-2.56-2.61-4.63-5.82-4.63Zm-2.1 3.58a.66.66 0 1 1 0 1.32.66.66 0 0 1 0-1.32Zm4.2 0a.66.66 0 1 1 0 1.32.66.66 0 0 1 0-1.32Z" />
    </svg>
  )
}

function TelegramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M21.42 4.58a1.37 1.37 0 0 0-1.44-.22L3.3 10.9c-.66.27-.63 1.22.05 1.43l4.25 1.37 1.66 5.07c.2.61.98.77 1.4.29l2.39-2.74 4.69 3.44c.57.42 1.38.1 1.51-.6l2.34-13.12c.08-.44-.11-.88-.5-1.14ZM9.03 13.17l8.95-5.5-7.38 6.73a.8.8 0 0 0-.25.41l-.53 2.45-1-3.04a.8.8 0 0 0-.52-.5l-2.55-.82 13.83-5.5-10.38 5.77a.8.8 0 0 0-.17 1.26Z" />
    </svg>
  )
}

function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12.04 2C6.5 2 2 6.45 2 11.94c0 1.76.47 3.49 1.37 5l-1.3 4.76a.95.95 0 0 0 1.16 1.17l4.88-1.25a10.1 10.1 0 0 0 3.93.78h.01c5.53 0 10.03-4.45 10.03-9.94C22.08 6.45 17.58 2 12.04 2Zm0 18.06h-.01c-1.21 0-2.39-.24-3.48-.72l-.25-.11-2.99.77.8-2.91-.13-.26a7.87 7.87 0 0 1-1.01-3.89c0-4.33 3.18-7.85 7.08-7.85 3.9 0 7.08 3.52 7.08 7.85s-3.18 7.12-7.09 7.12Zm4.27-5.38c-.23-.11-1.37-.67-1.58-.75-.21-.08-.36-.11-.51.11-.15.22-.59.75-.72.9-.13.15-.26.17-.49.06-.23-.11-.96-.35-1.82-1.11-.67-.6-1.13-1.34-1.26-1.56-.13-.22-.01-.34.1-.45.1-.1.23-.26.34-.39.11-.13.15-.22.23-.37.08-.15.04-.28-.02-.39-.06-.11-.51-1.23-.7-1.68-.18-.44-.37-.38-.51-.39h-.43c-.15 0-.39.06-.6.28-.21.22-.8.78-.8 1.9s.82 2.2.93 2.35c.11.15 1.6 2.44 3.87 3.42.54.23.96.37 1.29.47.54.17 1.02.14 1.41.08.43-.06 1.37-.56 1.56-1.1.19-.54.19-1 .13-1.1-.05-.1-.2-.16-.43-.27Z" />
    </svg>
  )
}

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.9 2H21l-6.57 7.5L22.16 22h-6.05l-4.74-6.2L5.95 22H3.84l7.03-8.03L2 2h6.2l4.28 5.67L18.9 2Zm-1.06 18.2h1.16L7.57 3.73H6.33L17.84 20.2Z" />
    </svg>
  )
}

function isUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

function normalizeTelegram(value: string): ContactBehavior {
  if (isUrl(value)) return { mode: "link", href: value, external: true }
  if (value.startsWith("@")) return { mode: "link", href: `https://t.me/${value.slice(1)}`, external: true }
  return { mode: "copy", value }
}

function normalizeX(value: string): ContactBehavior {
  if (isUrl(value)) return { mode: "link", href: value, external: true }
  if (value.startsWith("@")) return { mode: "link", href: `https://x.com/${value.slice(1)}`, external: true }
  return { mode: "copy", value }
}

function normalizeWhatsapp(value: string): ContactBehavior {
  if (isUrl(value)) return { mode: "link", href: value, external: true }
  const digits = value.replace(/[^\d]/g, "")
  if (digits) return { mode: "link", href: `https://wa.me/${digits}`, external: true }
  return { mode: "copy", value }
}

function normalizeQQ(value: string): ContactBehavior {
  const digits = value.replace(/[^\d]/g, "")
  if (digits) return { mode: "link", href: `https://wpa.qq.com/msgrd?v=3&uin=${encodeURIComponent(digits)}&site=qq&menu=yes`, external: true }
  if (isUrl(value)) return { mode: "link", href: value, external: true }
  return { mode: "copy", value }
}

function normalizeQQGroup(value: string): ContactBehavior {
  if (isUrl(value)) return { mode: "link", href: value, external: true }
  return { mode: "copy", value }
}

function normalizeEmail(value: string): ContactBehavior {
  return { mode: "link", href: `mailto:${value}`, external: false }
}

function displayText(item: ContactItem, mode: ContentMode) {
  if (mode === "label") return item.label
  if (mode === "value") return item.value
  return `${item.label}: ${item.value}`
}

export function ContactLinks({
  className,
  itemClassName,
  iconOnly = false,
  contentMode = "both",
}: ContactLinksProps) {
  const { config } = useSiteConfig()
  const { t } = useLocale()

  const contacts: ContactItem[] = [
    config?.contact_email_enabled && config.contact_email ? {
      key: "email",
      label: t("order.contactEmail"),
      value: config.contact_email,
      icon: Mail,
      iconClassName: "text-amber-500",
      behavior: normalizeEmail(config.contact_email),
    } : null,
    config?.contact_qq_enabled && config.contact_qq ? {
      key: "qq",
      label: t("order.contactQQ"),
      value: config.contact_qq,
      icon: QQIcon,
      iconClassName: "text-sky-500",
      behavior: normalizeQQ(config.contact_qq),
    } : null,
    config?.contact_qq_group_enabled && config.contact_qq_group ? {
      key: "qq-group",
      label: t("order.contactQQGroup"),
      value: config.contact_qq_group,
      icon: QQIcon,
      iconClassName: "text-sky-500",
      behavior: normalizeQQGroup(config.contact_qq_group),
    } : null,
    config?.contact_wechat_enabled && config.contact_wechat ? {
      key: "wechat",
      label: t("order.contactWechat"),
      value: config.contact_wechat,
      icon: WechatIcon,
      iconClassName: "text-emerald-500",
      behavior: { mode: "copy", value: config.contact_wechat },
    } : null,
    config?.contact_wechat_group_enabled && config.contact_wechat_group ? {
      key: "wechat-group",
      label: t("order.contactWechatGroup"),
      value: config.contact_wechat_group,
      icon: WechatIcon,
      iconClassName: "text-emerald-500",
      behavior: { mode: "copy", value: config.contact_wechat_group },
    } : null,
    config?.contact_telegram_enabled && config.contact_telegram ? {
      key: "telegram",
      label: t("order.contactTelegram"),
      value: config.contact_telegram,
      icon: TelegramIcon,
      iconClassName: "text-sky-500",
      behavior: normalizeTelegram(config.contact_telegram),
    } : null,
    config?.contact_telegram_group_enabled && config.contact_telegram_group ? {
      key: "telegram-group",
      label: t("order.contactTelegramGroup"),
      value: config.contact_telegram_group,
      icon: TelegramIcon,
      iconClassName: "text-sky-500",
      behavior: normalizeTelegram(config.contact_telegram_group),
    } : null,
    config?.contact_whatsapp_enabled && config.contact_whatsapp ? {
      key: "whatsapp",
      label: t("order.contactWhatsapp"),
      value: config.contact_whatsapp,
      icon: WhatsAppIcon,
      iconClassName: "text-emerald-500",
      behavior: normalizeWhatsapp(config.contact_whatsapp),
    } : null,
    config?.contact_x_enabled && config.contact_x ? {
      key: "x",
      label: t("order.contactX"),
      value: config.contact_x,
      icon: XIcon,
      iconClassName: "text-foreground",
      behavior: normalizeX(config.contact_x),
    } : null,
  ].filter(Boolean) as ContactItem[]

  if (contacts.length === 0) return null

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {contacts.map((item) => {
        const Icon = item.icon
        const commonClassName = cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground",
          iconOnly && "h-8 w-8 justify-center rounded-lg px-0 py-0",
          itemClassName
        )

        if (item.behavior.mode === "link") {
          return (
            <a
              key={item.key}
              href={item.behavior.href}
              target={item.behavior.external ? "_blank" : undefined}
              rel={item.behavior.external ? "noopener noreferrer" : undefined}
              className={commonClassName}
              title={displayText(item, contentMode)}
            >
              <Icon className={cn("h-3.5 w-3.5 shrink-0", item.iconClassName)} />
              {!iconOnly && <span className="truncate">{displayText(item, contentMode)}</span>}
            </a>
          )
        }

        const copyValue = item.behavior.value
        return (
          <button
            key={item.key}
            type="button"
            className={commonClassName}
            title={displayText(item, contentMode)}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(copyValue)
                toast.success(t("order.copied"))
              } catch {
                toast.error(t("common.error"))
              }
            }}
          >
            <Icon className={cn("h-3.5 w-3.5 shrink-0", item.iconClassName)} />
            {!iconOnly && <span className="truncate">{displayText(item, contentMode)}</span>}
          </button>
        )
      })}
    </div>
  )
}
