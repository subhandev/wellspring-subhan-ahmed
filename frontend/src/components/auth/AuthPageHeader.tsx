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
    <header className="mb-7">
      <h1
        id={titleId}
        className="text-[22px] font-semibold tracking-tight text-foreground"
      >
        {title}
      </h1>
      {description ? (
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </header>
  );
}
