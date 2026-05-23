"use server"

import { requireAuth as Silian_requireAuth } from "@/lib/auth-helpers"
import { prisma as Silian_prisma } from "@/lib/prisma"
import { revalidatePath as Silian_revalidatePath } from "next/cache"
import { redirect as Silian_redirect } from "next/navigation"
import { PATHS as Silian_PATHS } from "@/lib/cache-config"

export async function updateProfileAction(Silian_formData: FormData) {
  const Silian_session = await Silian_requireAuth()

  const Silian_name = Silian_formData.get("name") as string
  const Silian_image = Silian_formData.get("image") as string

  if (!Silian_name || Silian_name.trim() === "") {
    throw new Error("Name is required")
  }

  await Silian_prisma.user.update({
    where: { id: Silian_session.user.id },
    data: {
      name: Silian_name,
      ...(Silian_image ? { image: Silian_image } : {}),
    },
  })

  Silian_revalidatePath(Silian_PATHS.PROFILE)
  Silian_revalidatePath(Silian_PATHS.HOME)
  Silian_redirect(Silian_PATHS.PROFILE)
}
