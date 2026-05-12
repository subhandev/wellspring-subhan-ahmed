export function AuthPageHeader({
  title,
  description,
  titleId
}: {
  title: string;
  description?: string;
  /** For `aria-labelledby` on a wrapping section. */
  titleId?: string;
}) {
  return (
    <header className="space-y-1">
      <h1 id={titleId} className="text-xl font-semibold tracking-tight">
        {title}
      </h1>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </header>
  );
}
