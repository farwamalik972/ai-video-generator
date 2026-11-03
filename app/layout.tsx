import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Motion Studio | AI Video Generator",
  description: "Create AI video concepts from text prompts."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
