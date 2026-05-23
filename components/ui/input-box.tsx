import * as Silian_React from "react"

export interface InputBoxProps extends Silian_React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const InputBox = Silian_React.forwardRef<HTMLInputElement, InputBoxProps>(
  ({ className: Silian_className = "", error: Silian_error, ...Silian_props }, Silian_ref) => {
    let Silian_baseStyles =
      "w-full border border-tech-main/30 px-3 py-2.5 sm:px-4 sm:py-3 font-mono outline-none transition-colors focus:border-tech-main bg-white/50 text-tech-main-dark min-h-[44px] sm:min-h-auto"

    if (Silian_error) {
      Silian_baseStyles += " border-red-500 focus:border-red-500 text-red-600"
    }

    return (
      <input
        ref={Silian_ref}
        className={`
          ${Silian_baseStyles}
          ${Silian_className}
        `}
        {...Silian_props}
      />
    )
  }
)
InputBox.displayName = "InputBox"
