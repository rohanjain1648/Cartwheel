import "./globals.css";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import { SmoothScroll } from "@/components/SmoothScroll";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata = {
  title: "Cartwheel — Multiplayer AI Shared Shopping via WebMCP",
  description:
    "A real-time multiplayer shared cart where humans and autonomous AI agents collaborate via structured WebMCP tools with trust-boundary approvals.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
    >
      <body className="min-h-screen bg-canvas text-ink font-sans selection:bg-brand-lime selection:text-ink">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
