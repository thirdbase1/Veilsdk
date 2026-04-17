import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "v0 Demo - AI Analytics Platform",
  description: "A premium AI-powered interface for building and deploying dashboards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`antialiased bg-[#0a0a0a] text-[#ededed] h-screen overflow-hidden font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
