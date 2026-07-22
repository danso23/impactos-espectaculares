import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[96px] w-full resize-y rounded-xl border-[1.5px] border-transparent bg-violet-50/75 px-3.5 py-3 text-base font-medium text-slate-900 shadow-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-slate-400 hover:border-violet-200 focus-visible:border-violet-600 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/15 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
