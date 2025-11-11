import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-light tracking-wide transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 disabled:pointer-events-none disabled:opacity-50 shadow-lg hover:shadow-xl",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30 hover:from-amber-600 hover:to-amber-700 hover:shadow-amber-500/40 border border-amber-400/30",
        destructive:
          "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 hover:from-red-600 hover:to-red-700 hover:shadow-red-500/40 border border-red-400/30",
        outline:
          "border border-amber-500/30 bg-purple-800/20 text-amber-200 shadow-lg shadow-purple-900/30 hover:bg-purple-700/30 hover:border-amber-400/50 hover:text-amber-100",
        secondary:
          "bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-200 shadow-lg shadow-purple-500/20 hover:from-purple-500/30 hover:to-purple-600/30 border border-purple-500/30",
        ghost: "bg-gradient-to-r from-purple-800/20 to-purple-700/20 text-amber-200/70 hover:from-purple-700/30 hover:to-purple-600/30 hover:text-amber-200 border border-purple-600/30 hover:border-amber-500/40",
        link: "text-amber-300 underline-offset-4 hover:underline hover:text-amber-200",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-10 rounded-lg px-8",
        icon: "h-9 w-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
