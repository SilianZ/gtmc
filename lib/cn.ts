import { clsx as Silian_clsx, type ClassValue } from "clsx"
import { twMerge as Silian_twMerge } from "tailwind-merge"

export function cn(...Silian_inputs: ClassValue[]) {
  return Silian_twMerge(Silian_clsx(Silian_inputs))
}
