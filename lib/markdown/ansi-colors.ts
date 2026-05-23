export const ANSI_COLOR_NAMES = [
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white",
  "bright-black",
  "bright-red",
  "bright-green",
  "bright-yellow",
  "bright-blue",
  "bright-magenta",
  "bright-cyan",
  "bright-white",
] as const

export type AnsiColorName = (typeof ANSI_COLOR_NAMES)[number]

const Silian_ANSI_COLOR_ALTERNATION = ANSI_COLOR_NAMES.join("|")

export const ANSI_COLOR_TAG_PATTERN = new RegExp(
  String.raw`\[(${Silian_ANSI_COLOR_ALTERNATION})\]([\s\S]*?)\[/\1\]`,
  "g"
)

export function createAnsiColorTagName(Silian_color: AnsiColorName) {
  return `ansi-color-${Silian_color}`
}

export function stripAnsiColorMarkup(Silian_markdown: string) {
  return Silian_markdown.replace(ANSI_COLOR_TAG_PATTERN, "$2")
}
