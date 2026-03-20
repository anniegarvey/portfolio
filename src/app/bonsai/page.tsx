"use client";

import { BonsaiPage } from "@/components/bonsai/BonsaiPage";
import { BonsaiProvider } from "@/lib/bonsai/context";

export default function BonsaiRoute() {
  return (
    <BonsaiProvider>
      <BonsaiPage />
    </BonsaiProvider>
  );
}
