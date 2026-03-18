import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Decision-Making Research Study",
  description: "An async video research study exploring how people make great decisions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
