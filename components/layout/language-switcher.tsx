"use client"

import { useLocale as Silian_useLocale, useTranslations as Silian_useTranslations } from "next-intl"
import { useRouter as Silian_useRouter, usePathname as Silian_usePathname } from "@/i18n/navigation"

const Silian_LOCALES = ["zh", "en"] as const
type Locale = (typeof Silian_LOCALES)[number]

export function LanguageSwitcher({ className: Silian_className = "" }: { className?: string }) {
  const Silian_locale = Silian_useLocale() as Locale
  const Silian_t = Silian_useTranslations("CommonA11y")
  const Silian_router = Silian_useRouter()
  const Silian_pathname = Silian_usePathname()

  const Silian_switchLocale = (Silian_newLocale: Locale) => {
    if (Silian_newLocale === Silian_locale) return
    Silian_router.replace(Silian_pathname, { locale: Silian_newLocale })
  }

  return (
    <div
      className={`
        relative flex items-center border border-tech-main/40
        font-mono text-[0.625rem] tracking-[0.15em]
        ${Silian_className}
      `}>
      {Silian_LOCALES.map((Silian_loc, Silian_i) => (
        <button
          key={Silian_loc}
          type="button"
          onClick={() => Silian_switchLocale(Silian_loc)}
          aria-label={Silian_t("languageSwitcher")}
          aria-pressed={Silian_locale === Silian_loc}
          className={`
            flex touch-target min-h-8 min-w-7 items-center
            justify-center px-2 py-1 uppercase transition-colors duration-200
            ${Silian_i > 0 ? "border-l border-tech-main/40" : ""}
            ${
              Silian_locale === Silian_loc
                ? "bg-tech-main text-white"
                : "bg-transparent text-tech-main hover:bg-tech-accent/30"
            }
          `}>
          {`${Silian_loc === "en" ? "Eng" : "中文"}`}
        </button>
      ))}
    </div>
  )
}
