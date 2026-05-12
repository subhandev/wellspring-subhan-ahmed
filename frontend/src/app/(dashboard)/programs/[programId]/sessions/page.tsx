export default async function SessionsPage({
  params
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  return (
    <div>
      <h1 className="text-2xl font-semibold">Sessions</h1>
      <p className="mt-2 text-muted-foreground">
        Scaffold — drag-reorder + list for program {programId}.
      </p>
    </div>
  );
}
