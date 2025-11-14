import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-xl border border-amber-500/30 bg-purple-800/20 px-3 py-1 text-sm font-light tracking-wide text-amber-100 shadow-lg shadow-purple-900/30 transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-amber-200/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus:border-amber-400/50 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
