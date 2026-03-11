import type { Metadata, Viewport } from "next";
import { Lexend, Tangerine } from "next/font/google";
import "./globals.css";

import { Navigation } from "@/components/Navigation";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

const tangerine = Tangerine({
  variable: "--font-tangerine",
  subsets: ["latin"],
  weight: "700",
});

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js metadata must be exported from layout
export const metadata: Metadata = {
  title: "Annie Garvey's Portfolio",
  description:
    "Principal software engineer specializing in front-end development.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Energy Planner",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icon-192.png",
  },
};

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js viewport must be exported from layout
export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: "#1e293b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${lexend.variable} ${tangerine.variable}`}>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
