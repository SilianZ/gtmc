import { defineRouting as Silian_defineRouting } from "next-intl/routing"

export const routing = Silian_defineRouting({
  locales: ["zh", "en"],
  defaultLocale: "en",
  localePrefix: "always",
})
