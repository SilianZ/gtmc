import * as Silian_React from "react"
import { getSidebarTree as Silian_getSidebarTree } from "@/actions/sidebar"
import { ArticlesLayoutClient as Silian_ArticlesLayoutClient } from "./articles-layout-client"

export default async function ArticlesLayout({
  children: Silian_children,
  params: Silian_params,
}: {
  children: Silian_React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale: Silian_locale } = await Silian_params
  const Silian_tree = await Silian_getSidebarTree(Silian_locale === "zh" ? "zh" : "en")

  return <Silian_ArticlesLayoutClient tree={Silian_tree}>{Silian_children}</Silian_ArticlesLayoutClient>
}
