import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { detectLocaleFromHeaders, LOCALE_COOKIE_NAME } from "@/lib/locale-detect"

export function proxy(request: NextRequest) {
  const existingLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value
  if (["zh", "en", "ja", "ko", "es", "fr", "de"].includes(existingLocale ?? "")) {
    return NextResponse.next()
  }

  const locale = detectLocaleFromHeaders({
    cookie: request.headers.get("cookie"),
    country: request.headers.get("cf-ipcountry") ?? request.headers.get("x-vercel-ip-country"),
    acceptLanguage: request.headers.get("accept-language"),
  })

  const response = NextResponse.next()
  response.cookies.set(LOCALE_COOKIE_NAME, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })
  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"],
}
