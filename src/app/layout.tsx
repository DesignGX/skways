import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://skways.vercel.app"),
  title: {
    default: "SK Ways Logistics — The Smarter Way to Move",
    template: "%s | SK Ways Logistics",
  },
  description:
    "Reliable B2B local pickup and delivery services for businesses that need their goods delivered on time. Same-day delivery, recurring business delivery and flexible fleet services in Bengaluru.",
  keywords: [
    "B2B logistics",
    "local delivery",
    "same day delivery",
    "business delivery",
    "logistics company",
    "Bengaluru delivery",
  ],
  openGraph: {
    type: "website",
    title: "SK Ways Logistics — The Smarter Way to Move",
    description: "Reliable B2B pickup and delivery for businesses that need goods delivered on time.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}