export function formatErrorMessage(Silian_action: string, Silian_error: unknown): string {
  const Silian_detail = Silian_error instanceof Error ? Silian_error.message : "Unknown error"
  return `${Silian_action}: ${Silian_detail}`
}
