import type { Metadata, Viewport } from "next";
import { Lexend, Tangerine } from "next/font/google";
import "./globals.css";

import Navigation from "../components/Navigation";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

const tangerine = Tangerine({
  variable: "--font-tangerine",
  subsets: ["latin"],
  weight: "700",
});

export const metadata: Metadata = {
  title: "Annie Garvey's Portfolio",
  description:
    "Principal software engineer specializing in front-end development.",
};

export const viewport: Viewport = {
  colorScheme: "dark light",
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
