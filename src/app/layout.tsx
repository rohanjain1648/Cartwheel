import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Cartwheel",
  description: "A shared cart your agents can shop from — together.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
