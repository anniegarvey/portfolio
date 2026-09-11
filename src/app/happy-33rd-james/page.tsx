import type { Metadata } from "next";
import { HappyBirthdayCard } from "@/components/happy-birthday-james/HappyBirthdayCard";

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js metadata must be exported from the page
export const metadata: Metadata = {
  title: "Happy Birthday, James!",
  robots: { index: false, follow: false },
};

export default function HappyBirthdayJamesPage() {
  return <HappyBirthdayCard />;
}
