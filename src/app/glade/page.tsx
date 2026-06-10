import { GladePage } from "@/components/glade/GladePage";
import { GladeProvider } from "@/lib/glade/context";

export default function GladeRoute() {
  return (
    <GladeProvider>
      <GladePage />
    </GladeProvider>
  );
}
