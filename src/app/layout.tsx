import type { Metadata, Viewport } from "next";
import { Lexend, Tangerine } from "next/font/google";
import "./globals.css";

import { Navigation } from "@/components/Navigation";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PointsProvider } from "@/lib/points/context";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

const tangerine = Tangerine({
  variable: "--font-tangerine",
  subsets: ["latin"],
  weight: "700",
});

const APP_NAME = "Annie Garvey";
const APP_DEFAULT_TITLE = "Annie Garvey | Neurospicy Front End Specialist";
const APP_TITLE_TEMPLATE = `%s·|·${APP_NAME}`;
const APP_DESCRIPTION = "Energy planning with motivation and more";

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js metadata must be exported from layout
export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: APP_DEFAULT_TITLE,
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
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
      {/* Runs synchronously before paint to apply saved theme and prevent FOUC */}
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: intentional inline script for FOUC prevention
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t)}})()`,
          }}
        />
      </head>
      <body className={`${lexend.variable} ${tangerine.variable}`}>
        <ThemeProvider>
          <PointsProvider>
            <Navigation />
            {children}
          </PointsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
