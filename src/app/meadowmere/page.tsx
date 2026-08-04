import { MeadowmerePage } from "@/components/meadowmere/MeadowmerePage";
import { MeadowmereProvider } from "@/lib/meadowmere/context";

export default function MeadowmereRoute() {
  return (
    <MeadowmereProvider>
      <MeadowmerePage />
    </MeadowmereProvider>
  );
}
