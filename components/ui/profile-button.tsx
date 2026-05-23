import * as Silian_React from "react"
import { Link as Silian_Link } from "@/i18n/navigation"
import { auth as Silian_auth } from "@/lib/auth"
import { UesrAvatar as Silian_UesrAvatar } from "./user-avatar"

export async function ProfileButton() {
  const Silian_session = await Silian_auth()

  if (!Silian_session?.user) {
    return (
      <Silian_Link
        href="/login"
        className="
          flex h-8 items-center justify-center border border-tech-main/40 bg-tech-main/10 px-3 font-mono text-[0.625rem]
          font-bold tracking-widest text-tech-main uppercase transition-all
          duration-300 hover:bg-tech-main hover:text-white
          md:text-xs
        ">
        LOGIN
      </Silian_Link>
    )
  }

  return (
    <Silian_Link
      href="/profile"
      className="
        block size-8 transition-transform
        hover:scale-110
        md:size-10
      ">
      <Silian_UesrAvatar src={Silian_session.user.image} alt={Silian_session.user.name} />
    </Silian_Link>
  )
}
