import { createNavigation as Silian_createNavigation } from "next-intl/navigation"
import { routing as Silian_routing } from "./routing"

export const { Link, redirect, usePathname, useRouter, getPathname } =
  Silian_createNavigation(Silian_routing)
