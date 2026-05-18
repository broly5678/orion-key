import { cn } from "@/lib/utils"

interface BrandMarkProps {
  className?: string
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn("fill-none", className)}>
      <rect x="6" y="6" width="52" height="52" rx="16" fill="currentColor" opacity="0.14" />
      <path d="M18 20h26v6H25v9h16v6H25v13h-7V20Z" fill="currentColor" />
      <path d="M36 20h8l-8 14 8 20h-7l-6-14h-3v-6h3l5-14Z" fill="currentColor" />
    </svg>
  )
}
