import { BonsaiPage } from "@/components/bonsai/BonsaiPage";
import { BonsaiProvider } from "@/lib/bonsai/context";

export default async function BonsaiRoute({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const { demo } = await searchParams;
  return (
    <BonsaiProvider demoMode={demo === "1"}>
      <BonsaiPage />
    </BonsaiProvider>
  );
}
