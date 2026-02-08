/**
 * @MODULE_ID app.root-layout
 * @STAGE global
 * @DATA_INPUTS ["children"]
 * @REQUIRED_TOOLS ["AppShell", "TenantProvider"]
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/shared/components/AppShell";
import { TenantProvider } from "@/core/tenant-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zasterix | AI-Driven Wealth Engineering",
  description:
    "AI-native wealth engineering architecture for Yuh-driven financial journeys.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppShell>
          <TenantProvider>{children}</TenantProvider>
        </AppShell>
      </body>
    </html>
  );
}
