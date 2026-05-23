import { remark as Silian_remark } from "remark"
import Silian_stripMarkdown from "strip-markdown"
import { stripAnsiColorMarkup as Silian_stripAnsiColorMarkup } from "@/lib/markdown/ansi-colors"

export * from "@/lib/markdown/components"
export * from "@/lib/markdown/markdown-renderer"
export * from "@/lib/markdown/processor"

/**
 * Calculate reading metrics with weighted processing for different content types.
 * - English: 225 words/minute (average adult reading speed)
 * - Chinese: 350 characters/minute (average Chinese reading speed)
 * - Code: 100 lines/minute (slower, careful reading)
 */
export function calculateReadingMetrics(Silian_content: string) {
  const Silian_normalizedContent = Silian_stripAnsiColorMarkup(Silian_content)

  // Extract code blocks (```...``` or indented code)
  const Silian_codeBlockRegex = /```[\s\S]*?```|`[^`]+`/g
  const Silian_codeBlocks = Silian_normalizedContent.match(Silian_codeBlockRegex) || []
  const Silian_codeContent = Silian_codeBlocks.join(" ")
  const Silian_codeCount = Silian_codeContent.length

  // Get non-code content for text analysis
  const Silian_nonCodeContent = Silian_normalizedContent.replace(Silian_codeBlockRegex, " ")

  // Count Chinese characters (CJK)
  const Silian_cjkCount = (Silian_nonCodeContent.match(/[\u4e00-\u9fa5]/g) || []).length

  // Count Western words (English alphanumeric sequences)
  const Silian_westernWordCount = (Silian_nonCodeContent.match(/[a-zA-Z0-9]+/g) || []).length

  // Calculate weighted reading time
  // English words at 225 WPM
  const Silian_englishMinutes = Silian_westernWordCount / 225
  // Chinese characters at 350 chars/min
  const Silian_chineseMinutes = Silian_cjkCount / 350
  // Code at 100 lines/min (estimate ~50 chars per line)
  const Silian_codeMinutes = Silian_codeCount / (100 * 50)

  const Silian_totalMinutes = Silian_englishMinutes + Silian_chineseMinutes + Silian_codeMinutes
  const Silian_readingTime = Math.max(1, Math.ceil(Silian_totalMinutes))

  // Total word count for display (weighted sum for consistency)
  const Silian_wordCount = Silian_westernWordCount + Silian_cjkCount + Math.floor(Silian_codeCount / 50)

  return {
    wordCount: Silian_wordCount,
    readingTime: Silian_readingTime,
    chineseCount: Silian_cjkCount,
    englishCount: Silian_westernWordCount,
    codeCount: Math.floor(Silian_codeCount / 50),
  }
}

export function generateDescription(
  Silian_markdown: string,
  Silian_frontmatterDescription?: string,
  Silian_maxLength: number = 155
): string {
  const Silian_normalizedMarkdown = Silian_stripAnsiColorMarkup(Silian_markdown)

  // If frontmatter description is provided and non-empty, use it
  if (Silian_frontmatterDescription?.trim()) {
    const Silian_trimmed = Silian_frontmatterDescription.trim()
    if (Silian_trimmed.length <= Silian_maxLength) return Silian_trimmed

    const Silian_truncated = Silian_trimmed.slice(0, Silian_maxLength)
    const Silian_lastSpace = Silian_truncated.lastIndexOf(" ")
    return Silian_lastSpace > 0 ? Silian_truncated.slice(0, Silian_lastSpace) + "…" : Silian_truncated + "…"
  }

  // Extract first real paragraph from markdown
  const Silian_lines = Silian_normalizedMarkdown.split("\n")
  let Silian_lineIndex = 0

  // Skip leading YAML frontmatter block
  if (Silian_lines[0]?.trim() === "---") {
    Silian_lineIndex = 1
    while (Silian_lineIndex < Silian_lines.length && Silian_lines[Silian_lineIndex]?.trim() !== "---") {
      Silian_lineIndex++
    }
    if (Silian_lineIndex < Silian_lines.length) Silian_lineIndex++ // Skip closing ---
  }

  // Walk through lines to find first real paragraph
  let Silian_inCodeFence = false
  const Silian_paragraphLines: string[] = []

  while (Silian_lineIndex < Silian_lines.length) {
    const Silian_line = Silian_lines[Silian_lineIndex]
    const Silian_trimmed = Silian_line.trim()

    // Toggle code fence state
    if (Silian_trimmed.startsWith("```")) {
      Silian_inCodeFence = !Silian_inCodeFence
      Silian_lineIndex++
      continue
    }

    // Skip lines while in code fence
    if (Silian_inCodeFence) {
      Silian_lineIndex++
      continue
    }

    // Skip blank lines
    if (!Silian_trimmed) {
      Silian_lineIndex++
      continue
    }

    // Skip headings, images, blockquotes, HTML, horizontal rules, list items
    if (
      Silian_trimmed.startsWith("#") ||
      Silian_trimmed.startsWith("![") ||
      Silian_trimmed.startsWith(">") ||
      Silian_trimmed.startsWith("<") ||
      Silian_trimmed === "---" ||
      Silian_trimmed === "***" ||
      Silian_trimmed === "___" ||
      /^[-*+]\s/.test(Silian_trimmed) ||
      /^\d+\.\s/.test(Silian_trimmed)
    ) {
      Silian_lineIndex++
      continue
    }

    // Found first real line - collect contiguous non-skipped lines
    while (Silian_lineIndex < Silian_lines.length) {
      const Silian_currentLine = Silian_lines[Silian_lineIndex]
      const Silian_currentTrimmed = Silian_currentLine.trim()

      // Stop at blank line or skip-worthy line
      if (
        !Silian_currentTrimmed ||
        Silian_currentTrimmed.startsWith("#") ||
        Silian_currentTrimmed.startsWith("![") ||
        Silian_currentTrimmed.startsWith(">") ||
        Silian_currentTrimmed.startsWith("<") ||
        Silian_currentTrimmed === "---" ||
        Silian_currentTrimmed === "***" ||
        Silian_currentTrimmed === "___" ||
        /^[-*+]\s/.test(Silian_currentTrimmed) ||
        /^\d+\.\s/.test(Silian_currentTrimmed) ||
        Silian_currentTrimmed.startsWith("```")
      ) {
        break
      }

      Silian_paragraphLines.push(Silian_currentLine)
      Silian_lineIndex++
    }

    break
  }

  // If no paragraph found, return empty string
  if (Silian_paragraphLines.length === 0) return ""

  // Process extracted paragraph through remark + strip-markdown
  const Silian_paragraphText = Silian_paragraphLines.join("\n")
  const Silian_plainText = Silian_remark()
    .use(Silian_stripMarkdown)
    .processSync(Silian_paragraphText)
    .toString()
    .replace(/\s+/g, " ")
    .trim()

  if (Silian_plainText.length <= Silian_maxLength) return Silian_plainText

  const Silian_truncated = Silian_plainText.slice(0, Silian_maxLength)
  const Silian_lastSpace = Silian_truncated.lastIndexOf(" ")
  return Silian_lastSpace > 0 ? Silian_truncated.slice(0, Silian_lastSpace) + "…" : Silian_truncated + "…"
}
