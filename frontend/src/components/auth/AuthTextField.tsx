import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type AuthTextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
};

export const AuthTextField = forwardRef<HTMLInputElement, AuthTextFieldProps>(function AuthTextField(
  { id, label, className, ...props },
  ref
) {
  return (
    <div className={cn("field", className)}>
      <input ref={ref} id={id} name={props.name ?? id} placeholder=" " {...props} />
      <label htmlFor={id}>{label}</label>
    </div>
  );
});
