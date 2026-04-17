import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Open Brainy - Full-Stack AI Engineer",
  description: "A professional AI-powered platform for building and deploying full-stack applications.",
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
