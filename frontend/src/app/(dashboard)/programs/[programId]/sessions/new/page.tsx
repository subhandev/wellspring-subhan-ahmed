export default async function NewSessionPage({
  params
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  return (
    <div>
      <h1 className="text-2xl font-semibold">New session</h1>
      <p className="mt-2 text-muted-foreground">Scaffold — program {programId}.</p>
    </div>
  );
}
