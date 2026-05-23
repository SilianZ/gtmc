import { getRequestConfig as Silian_getRequestConfig } from "next-intl/server"
import { routing as Silian_routing } from "./routing"

export default Silian_getRequestConfig(async ({ requestLocale: Silian_requestLocale }) => {
  let Silian_locale = await Silian_requestLocale

  if (
    !Silian_locale ||
    !Silian_routing.locales.includes(Silian_locale as (typeof Silian_routing.locales)[number])
  ) {
    Silian_locale = Silian_routing.defaultLocale
  }

  return {
    locale: Silian_locale,
    messages: (await import(`../messages/${Silian_locale}.json`)).default,
  }
})
