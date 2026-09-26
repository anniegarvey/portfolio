import { BonsaiPage } from "@/components/bonsai/BonsaiPage";
import { BonsaiProvider } from "@/lib/bonsai/context";

// Served at /bonsai?demo=1 by the rewrite in next.config.ts, so both the demo
// and the plain garden are static and can be prefetched in full.
export default function BonsaiDemoRoute() {
  return (
    <BonsaiProvider demoMode>
      <BonsaiPage />
    </BonsaiProvider>
  );
}
