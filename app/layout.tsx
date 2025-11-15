import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppLineraProvider } from "@/components/providers/linera";
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
  title: "Fairdrop - Linera Auctions",
  description: "Descending-price auctions on Linera blockchain",
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
        <AppLineraProvider>
          {children}
        </AppLineraProvider>
      </body>
    </html>
  );
}
