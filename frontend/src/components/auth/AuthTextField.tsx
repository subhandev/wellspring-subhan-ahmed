import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const fieldClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export type AuthTextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
};

export const AuthTextField = forwardRef<HTMLInputElement, AuthTextFieldProps>(function AuthTextField(
  { id, label, className, ...props },
  ref
) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium leading-none" htmlFor={id}>
        {label}
      </label>
      <input ref={ref} id={id} className={cn(fieldClass, className)} {...props} />
    </div>
  );
});
