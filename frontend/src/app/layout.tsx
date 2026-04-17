import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Maternix Track",
  description:
    "Advanced clinical tracking for nursing students and instructors in maternal health education.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background">
        <Header />
        {children}
      </body>
    </html>
  );
}
