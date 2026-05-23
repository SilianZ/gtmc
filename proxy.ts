import Silian_createMiddleware from "next-intl/middleware"
import { routing as Silian_routing } from "@/i18n/routing"

export default Silian_createMiddleware(Silian_routing)

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
}
