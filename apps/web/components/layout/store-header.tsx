"use client"

import { useCallback, useRef, useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { ShoppingCart, User, LogIn, Menu, X, Globe, Moon, Sun, Search, Settings, ChevronDown, SlidersHorizontal, LogOut, ClipboardList, MessageCircleMore } from "lucide-react"
import { useAuth, useLocale, useTheme, useColorScheme, useSearch, useCart, useSiteConfig, COLOR_SCHEMES, type SortKey } from "@/lib/context"
import { BrandMark } from "@/components/shared/brand-mark"
import { ContactLinks } from "@/components/shared/contact-links"
import { localizeSiteConfigValue, localizeSiteField } from "@/lib/storefront-site-i18n"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface StoreHeaderProps {
  siteName?: string
}

const LANGUAGE_OPTIONS = [
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
] as const

export function StoreHeader({ siteName }: StoreHeaderProps) {
  const { t, locale, setLocale } = useLocale()
  const { setTheme, resolvedTheme } = useTheme()
  const { isLoggedIn, user, logout, authLoaded } = useAuth()
  const { colorScheme, setColorScheme } = useColorScheme()
  const { itemCount: cartItemCount } = useCart()
  const { config: siteConfig } = useSiteConfig()
  const {
    searchQuery, setSearchQuery,
    searchOpen, setSearchOpen,
    sortBy, setSortBy,
    filterOpen, setFilterOpen,
    inStockOnly, setInStockOnly,
    priceMin, setPriceMin,
    priceMax, setPriceMax,
  } = useSearch()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)

  const openSearch = useCallback(() => {
    setSearchOpen(true)
    setTimeout(() => searchInputRef.current?.focus(), 80)
  }, [setSearchOpen])

  const closeSearch = useCallback(() => {
    setSearchOpen(false)
  }, [setSearchOpen])

  // Escape to close search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && searchOpen) closeSearch()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [searchOpen, closeSearch])

  // Close sort dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/cart", label: t("nav.cart") },
    { href: "/order/query", label: t("nav.orders") },
  ]

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark")

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "default", label: t("home.sortDefault") },
    { key: "hot", label: t("home.sortHot") },
    { key: "price_low", label: t("home.sortPriceLow") },
    { key: "price_high", label: t("home.sortPriceHigh") },
    { key: "new", label: t("home.sortNew") },
  ]

  const activeFilterCount =
    (inStockOnly ? 1 : 0) + (priceMin ? 1 : 0) + (priceMax ? 1 : 0)
  const resolvedSiteName = siteName || localizeSiteConfigValue(siteConfig, "site_name", locale) || localizeSiteField("site_name", "FK Shop", locale)

  const resetFilters = () => {
    setInStockOnly(false)
    setPriceMin("")
    setPriceMax("")
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4 lg:px-6">
        {/* Logo -- fixed width to balance right actions */}
        <div className="flex min-w-0 flex-1 items-center">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 text-foreground">
            {siteConfig?.logo_url ? (
              <img src={siteConfig.logo_url} alt={resolvedSiteName} className="h-6 w-6 rounded object-contain" />
            ) : (
              <BrandMark className="h-6 w-6 text-primary" />
            )}
            <span className="hidden text-lg font-extrabold tracking-tight sm:inline">{resolvedSiteName}</span>
          </Link>
        </div>

        {/* Desktop Nav -- absolute center */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {navLinks.map((link) => {
            const isCart = link.href === "/cart"
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  pathname === link.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                {isCart ? (
                  <span className="flex items-center gap-1.5">
                    <ShoppingCart className="h-3.5 w-3.5" />
                    {link.label}
                    {cartItemCount > 0 && (
                      <span className="relative flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground shadow-sm">
                        {cartItemCount > 99 ? "99+" : cartItemCount}
                        <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-20" />
                      </span>
                    )}
                  </span>
                ) : (
                  link.label
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right Actions -- flex-1 to match logo side */}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
          {/* Search Toggle -- prominent icon button */}
          <button
            onClick={searchOpen ? closeSearch : openSearch}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors",
              searchOpen
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
            aria-label="Search"
          >
            {searchOpen ? <X className="h-[18px] w-[18px]" /> : <Search className="h-[18px] w-[18px]" />}
            {!searchOpen && (
              <span className="hidden text-xs font-semibold sm:inline">
                {t("home.searchButton")}
              </span>
            )}
          </button>

          {/* Color Scheme Picker (hidden on mobile, in hamburger menu) */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setColorPickerOpen(!colorPickerOpen)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              aria-label="Color scheme"
            >
              <span className="h-4 w-4 rounded-full bg-primary" />
            </button>
            {colorPickerOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setColorPickerOpen(false)} />
                <div className="absolute right-0 z-50 mt-1 flex gap-1.5 rounded-lg border border-border bg-popover p-2 shadow-lg">
                  {COLOR_SCHEMES.map((scheme) => (
                    <button
                      key={scheme.key}
                      onClick={() => {
                        setColorScheme(scheme.key)
                        setColorPickerOpen(false)
                      }}
                      style={{ backgroundColor: scheme.color }}
                      className={cn(
                        "h-6 w-6 rounded-full transition-all",
                        colorScheme === scheme.key
                          ? "scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-background"
                          : "hover:scale-110"
                      )}
                      aria-label={scheme.label}
                      title={scheme.label}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="h-4 w-4 hidden dark:block" />
          </button>

          {/* Locale Toggle */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                aria-label="Change language"
              >
                <Globe className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-44 p-1">
              <div className="space-y-1">
                {LANGUAGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setLocale(option.value)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                      locale === option.value
                        ? "bg-accent font-medium text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <span>{option.label}</span>
                    {locale === option.value && <span className="text-xs text-primary">Current</span>}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="hidden lg:inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 bg-background/70 px-3 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:bg-accent hover:text-foreground"
                aria-label={t("order.needHelp")}
              >
                <MessageCircleMore className="h-4 w-4 text-primary" />
                <span>{t("order.needHelp")}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="hidden w-[22rem] lg:block">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("order.needHelp")}</p>
                  <p className="text-xs text-muted-foreground">{t("order.contactTip")}</p>
                </div>
                <ContactLinks className="gap-2" itemClassName="w-full justify-start rounded-xl px-3 py-2" contentMode="both" />
              </div>
            </PopoverContent>
          </Popover>

          {/* Order Query (mobile only) */}
          <Link
            href="/order/query"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:hidden"
            aria-label={t("nav.orders")}
          >
            <ClipboardList className="h-4 w-4" />
          </Link>

          {/* Cart (tablet only, mobile in hamburger menu) */}
          <Link
            href="/cart"
            className="relative hidden h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:inline-flex md:hidden"
            aria-label={t("nav.cart")}
          >
            <ShoppingCart className="h-4 w-4" />
            {cartItemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {cartItemCount > 99 ? "99+" : cartItemCount}
              </span>
            )}
          </Link>

          {/* User / Auth — auth 未就绪时显示占位，避免登录按钮闪烁 */}
          {!authLoaded ? (
            <div className="h-9 w-9 animate-pulse rounded-md bg-muted" />
          ) : isLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user?.username}</span>
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 z-50 mt-1 w-48 rounded-md border border-border bg-popover p-1 shadow-lg">
                    <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-popover-foreground hover:bg-accent">
                      <User className="h-4 w-4" />{t("nav.profile")}
                    </Link>
                    <Link href="/my/orders" onClick={() => setUserMenuOpen(false)} className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-popover-foreground hover:bg-accent">
                      <Search className="h-4 w-4" />{t("nav.myOrders")}
                    </Link>
                    {user?.role === "ADMIN" && (
                      <Link href="/admin/dashboard" onClick={() => setUserMenuOpen(false)} className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-popover-foreground hover:bg-accent">
                        <Settings className="h-4 w-4" />{t("nav.admin")}
                      </Link>
                    )}
                    <hr className="my-1 border-border" />
                    <button onClick={() => { logout(); setUserMenuOpen(false) }} className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent">
                      <LogOut className="h-4 w-4" />{t("nav.logout")}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link href="/login" className="inline-flex h-9 items-center rounded-md bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 px-2.5 sm:px-4">
              <LogIn className="h-4 w-4 sm:hidden" />
              <span className="hidden sm:inline">{t("nav.login")}</span>
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Search Bar + Sort/Filter */}
      {searchOpen && (
        <div className="border-t border-border bg-background/95 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-3 lg:px-6">
            <div className="flex items-center gap-2">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t("home.search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Sort dropdown */}
              <div ref={sortRef} className="relative">
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  <span className="hidden sm:inline">
                    {sortOptions.find((s) => s.key === sortBy)?.label}
                  </span>
                  <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", sortOpen && "rotate-180")} />
                </button>
                {sortOpen && (
                  <div className="absolute right-0 z-30 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => { setSortBy(opt.key); setSortOpen(false) }}
                        className={cn(
                          "flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-accent",
                          sortBy === opt.key ? "bg-accent/50 font-medium text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Filter toggle */}
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className={cn(
                  "relative inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors",
                  filterOpen || activeFilterCount > 0
                    ? "border-foreground/20 bg-foreground/5 text-foreground"
                    : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("home.filterTitle")}</span>
                {activeFilterCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Filter panel */}
            {filterOpen && (
              <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">{t("home.filterPrice")}:</span>
                  <input type="number" placeholder={t("common.min")} value={priceMin} onChange={(e) => setPriceMin(e.target.value)} className="h-8 w-20 rounded-md border border-input bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                  <span className="text-xs text-muted-foreground">-</span>
                  <input type="number" placeholder={t("common.max")} value={priceMax} onChange={(e) => setPriceMax(e.target.value)} className="h-8 w-20 rounded-md border border-input bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="h-3.5 w-3.5 rounded border-input accent-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">{t("home.filterInStock")}</span>
                </label>
                {activeFilterCount > 0 && (
                  <button onClick={resetFilters} className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
                    <X className="h-3 w-3" />{t("home.filterReset")}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <nav className="border-t border-border px-4 py-3 md:hidden" aria-label="Mobile navigation">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const isCart = link.href === "/cart"
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {isCart && <ShoppingCart className="h-4 w-4" />}
                  {link.label}
                  {isCart && cartItemCount > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {cartItemCount > 99 ? "99+" : cartItemCount}
                    </span>
                  )}
                </Link>
              )
            })}
            {/* Color scheme (mobile only) */}
            <hr className="my-1 border-border sm:hidden" />
            <div className="flex items-center gap-2 px-3 py-2 sm:hidden">
              <span className="text-sm text-muted-foreground">{t("theme.colorLabel")}</span>
              <div className="flex gap-1.5">
                {COLOR_SCHEMES.map((scheme) => (
                  <button
                    key={scheme.key}
                    onClick={() => setColorScheme(scheme.key)}
                    style={{ backgroundColor: scheme.color }}
                    className={cn(
                      "h-5 w-5 rounded-full transition-all",
                      colorScheme === scheme.key
                        ? "ring-2 ring-foreground ring-offset-1 ring-offset-background"
                        : ""
                    )}
                    aria-label={scheme.label}
                  />
                ))}
              </div>
            </div>
            <div className="px-3 py-2">
              <ContactLinks />
            </div>
            <div className="px-3 py-2">
              <div className="rounded-lg border border-border bg-card p-2">
                <div className="mb-2 text-xs font-medium text-muted-foreground">
                  {t("theme.languageLabel")}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {LANGUAGE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setLocale(option.value)
                        setMobileMenuOpen(false)
                      }}
                      className={cn(
                        "rounded-md px-2 py-2 text-left text-sm transition-colors",
                        locale === option.value
                          ? "bg-accent font-medium text-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
