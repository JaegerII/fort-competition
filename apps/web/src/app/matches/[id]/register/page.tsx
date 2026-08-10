import { notFound } from "next/navigation";
import { matches } from "@/lib/mock-data";
import { RegisterFlow } from "@/components/register-flow";

export function generateStaticParams() {
  return matches.map((m) => ({ id: m.id }));
}
export const dynamicParams = false;

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = matches.find((m) => m.id === id);
  if (!match || match.registrationStatus === "closed") notFound();

  return <RegisterFlow match={match} />;
}
