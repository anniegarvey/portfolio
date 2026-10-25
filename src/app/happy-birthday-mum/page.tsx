import type { Metadata } from "next";
import { BirthdayMumCard } from "@/components/happy-birthday-mum/BirthdayMumCard";

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js metadata must be exported from the page
export const metadata: Metadata = {
  title: "Happy Birthday, Mum!",
  robots: { index: false, follow: false },
};

export default function HappyBirthdayMumPage() {
  return <BirthdayMumCard />;
}
