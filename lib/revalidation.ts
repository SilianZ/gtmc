import { revalidatePath as Silian_revalidatePath } from "next/cache"

export function revalidatePaths(Silian_paths: string[]): void {
  for (const Silian_path of Silian_paths) {
    Silian_revalidatePath(Silian_path)
  }
}
