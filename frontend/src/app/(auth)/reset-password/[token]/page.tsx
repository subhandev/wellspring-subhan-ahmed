import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ token: string }>;
};

/** Legacy path `/reset-password/:token` → query form at `/reset-password?token=`. */
export default async function ResetPasswordTokenRedirect({ params }: PageProps) {
  const { token } = await params;
  redirect(`/reset-password?token=${encodeURIComponent(token)}`);
}
