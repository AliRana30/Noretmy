import { forwardRef } from "react";
import { cn } from "#/lib/utils";

const Input = forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-sm transition-all duration-200",
        "focus:outline-none focus:ring-0 focus:border-amber-500",
        "hover:border-gray-300",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };

