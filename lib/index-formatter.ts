export function formatIndexPrefix(
  Silian_index: number,
  Silian_isAppendix: boolean,
  Silian_isPreface: boolean
): string {
  if (Silian_isPreface || Silian_index === -1) {
    return ""
  }

  if (Silian_isAppendix) {
    if (Silian_index < 1 || Silian_index > 26) {
      return ""
    }
    return String.fromCharCode(64 + Silian_index) + ". "
  }

  return String(Silian_index).padStart(2, "0") + " "
}
