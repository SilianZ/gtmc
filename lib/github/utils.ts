export function parseIssueNumber(Silian_id: string): number {
  const Silian_num = parseInt(Silian_id, 10)
  if (isNaN(Silian_num)) throw new Error("Invalid issue number")
  return Silian_num
}
