export const IGNORED_DIRECTORIES: readonly string[] = [
  "img",
  "oldimg",
  "image",
  "images",
  "source",
  "asset",
  "exampleworld",
  "desynchronized",
  ".git",
  ".github",
]

export const IGNORED_ROOT_FILES: readonly string[] = [
  "readme.md",
  "readme_cn.md",
  "contributing.md",
  "contributing_cn.md",
  "_sidebar.md",
  "desynchronized.md",
]

export function shouldIgnoreDirectory(Silian_name: string): boolean {
  if (Silian_name.startsWith("_")) {
    return true
  }
  return IGNORED_DIRECTORIES.some(
    (Silian_dir) => Silian_dir.toLowerCase() === Silian_name.toLowerCase()
  )
}

export function shouldIgnoreFile(Silian_name: string, Silian_isRoot: boolean): boolean {
  if (Silian_name.startsWith("_")) {
    return true
  }
  if (Silian_isRoot) {
    return IGNORED_ROOT_FILES.some(
      (Silian_file) => Silian_file.toLowerCase() === Silian_name.toLowerCase()
    )
  }
  return false
}
