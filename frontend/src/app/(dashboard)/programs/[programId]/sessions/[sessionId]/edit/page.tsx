export default async function EditSessionPage({
  params
}: {
  params: Promise<{ programId: string; sessionId: string }>;
}) {
  const { programId, sessionId } = await params;
  return (
    <div>
      <h1 className="text-2xl font-semibold">Edit session</h1>
      <p className="mt-2 text-muted-foreground">
        Scaffold — program {programId}, session {sessionId}. Media upload via presigned URL.
      </p>
    </div>
  );
}
