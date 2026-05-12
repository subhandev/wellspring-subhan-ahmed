export default async function ProgramDetailPage({
  params
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  return (
    <div>
      <h1 className="text-2xl font-semibold">Program</h1>
      <p className="mt-2 text-muted-foreground">Scaffold — program id: {programId}</p>
    </div>
  );
}
