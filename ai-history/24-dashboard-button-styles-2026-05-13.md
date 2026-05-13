# AI session note — dashboard button / design tokens

Date: 2026-05-13

- Updated `frontend/src/components/ui/Button.tsx`: Wellspring-aligned shadows (charcoal-tinted, soft), `tracking-tight`, focus ring, `active:scale-[0.98]`, outline uses `bg-card`, secondary has light border, destructive has border + tint. New size `md` (h-10) for form parity with `dashInputCn` (h-10). Default/sm/icon sizes bumped for better touch targets.
- `frontend/src/lib/dashboardUi.ts`: `dashFormActions`, `dashListActions`, `dashInsetButtonRow`.
- Dashboard pages: form footers use `dashFormActions` + outline/submit `size="md"`; programs list uses `dashListActions`; session list drag handle uses `buttonVariants` ghost+icon-sm; sessions/program headers use `default` where primary; import wrapped in `dashSectionCard` + `dashFormSection` + token inputs; audit filters use `dashLabel`/`dashInputCn` + apply button `md`; `ConfirmDialog` rounded-xl + card shadow + `md` buttons; `AppSidebar` logout uses ghost button tokens.
- Auth route files not edited; shared `Button` still applies on auth pages that import it.
