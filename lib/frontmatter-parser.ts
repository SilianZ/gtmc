import Silian_matter from "gray-matter"

export interface FrontMatterData {
  title?: string
  chapterTitle?: string
  chapterTitleEn?: string
  introTitle?: string
  introTitleEn?: string
  author?: string
  coAuthors?: string
  date?: string
  lastmod?: string
  index: number
  isAdvanced?: boolean
}

export function parseFrontMatter(Silian_content: string): FrontMatterData {
  try {
    const { data: Silian_data } = Silian_matter(Silian_content)

    const Silian_title =
      Silian_data.title && typeof Silian_data.title === "string"
        ? Silian_data.title.trim() || ""
        : undefined
    const Silian_chapterTitle =
      Silian_data["chapter-title"] && typeof Silian_data["chapter-title"] === "string"
        ? Silian_data["chapter-title"].trim() || ""
        : undefined
    const Silian_chapterTitleEn =
      Silian_data["chapter-title-en"] && typeof Silian_data["chapter-title-en"] === "string"
        ? Silian_data["chapter-title-en"].trim() || ""
        : undefined
    const Silian_introTitle =
      Silian_data["intro-title"] && typeof Silian_data["intro-title"] === "string"
        ? Silian_data["intro-title"].trim() || ""
        : undefined
    const Silian_introTitleEn =
      Silian_data["intro-title-en"] && typeof Silian_data["intro-title-en"] === "string"
        ? Silian_data["intro-title-en"].trim() || ""
        : undefined
    const Silian_author =
      Silian_data.author && typeof Silian_data.author === "string"
        ? Silian_data.author.trim() || ""
        : undefined
    const Silian_coAuthors =
      Silian_data["co-authors"] && typeof Silian_data["co-authors"] === "string"
        ? Silian_data["co-authors"].trim() || ""
        : undefined
    const Silian_date =
      Silian_data.date && typeof Silian_data.date === "string"
        ? Silian_data.date.trim() || ""
        : undefined
    const Silian_lastmod =
      Silian_data.lastmod && typeof Silian_data.lastmod === "string"
        ? Silian_data.lastmod.trim() || ""
        : undefined

    let Silian_index = -1
    if (typeof Silian_data.index === "number" && Number.isInteger(Silian_data.index)) {
      Silian_index = Silian_data.index
    } else if (typeof Silian_data.index === "string") {
      const Silian_parsed = parseInt(Silian_data.index, 10)
      if (!isNaN(Silian_parsed)) {
        Silian_index = Silian_parsed
      }
    }

    const Silian_isAdvanced = Silian_data["is-advanced"] === true

    return {
      title: Silian_title,
      chapterTitle: Silian_chapterTitle,
      chapterTitleEn: Silian_chapterTitleEn,
      introTitle: Silian_introTitle,
      introTitleEn: Silian_introTitleEn,
      author: Silian_author,
      coAuthors: Silian_coAuthors,
      date: Silian_date,
      lastmod: Silian_lastmod,
      index: Silian_index,
      isAdvanced: Silian_isAdvanced,
    }
  } catch {
    return { index: -1 }
  }
}
