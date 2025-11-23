import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { styled } from "next-yak";
import Navigation from "../components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Annie Garvey's Portfolio",
  description:
    "Principal software engineer specializing in front-end development.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Navigation />
        <Main>{children}</Main>
      </body>
    </html>
  );
}

const Main = styled.main`
  max-width: calc(75ch + 2*32px);
  padding: 32px;
  margin-inline: auto;
`;
