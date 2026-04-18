import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import PasscodeGate from "@/components/PasscodeGate";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LegalAI — Ogata Law",
  description: "Criminal defense case analysis",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full">
        <PasscodeGate>{children}</PasscodeGate>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
