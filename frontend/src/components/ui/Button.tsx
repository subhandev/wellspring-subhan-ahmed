import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-clip-padding",
    "text-sm font-medium tracking-tight whitespace-nowrap outline-none select-none",
    "transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-150 ease-out",
    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/35",
    "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_1px_2px_rgb(28_28_26/0.08)] hover:bg-primary-hover hover:shadow-[0_2px_10px_-4px_rgb(28_28_26/0.16)] dark:shadow-[0_1px_2px_rgb(0_0_0/0.35)] dark:hover:shadow-[0_2px_12px_-4px_rgb(0_0_0/0.45)]",
        outline:
          "border-border bg-card text-foreground shadow-[0_1px_1px_rgb(28_28_26/0.04)] hover:border-border hover:bg-muted/55 hover:text-foreground aria-expanded:bg-muted/60 aria-expanded:text-foreground dark:border-input dark:bg-input/25 dark:hover:bg-input/45",
        secondary:
          "border-border/80 bg-secondary text-secondary-foreground shadow-[0_1px_1px_rgb(28_28_26/0.03)] hover:border-border hover:bg-secondary/90 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground dark:border-input dark:hover:bg-secondary/80",
        ghost:
          "hover:bg-muted/80 hover:text-foreground aria-expanded:bg-muted/80 aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "border-destructive/25 bg-destructive/[0.08] text-destructive shadow-none hover:border-destructive/35 hover:bg-destructive/[0.14] focus-visible:border-destructive/45 focus-visible:ring-destructive/25 dark:bg-destructive/15 dark:hover:bg-destructive/25",
        link: "border-transparent text-primary underline-offset-4 shadow-none hover:underline active:scale-100"
      },
      size: {
        default:
          "h-9 min-h-9 gap-2 px-3.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        md: "h-10 min-h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
        xs: "h-6 min-h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 min-h-8 gap-1.5 rounded-[min(var(--radius-md),12px)] px-3 text-[0.8125rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 min-h-10 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-9 min-h-9 min-w-9",
        "icon-xs":
          "size-7 min-h-7 min-w-7 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 min-h-8 min-w-8 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-10 min-h-10 min-w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
