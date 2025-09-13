import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "PillSnap - AI-Powered Pill Identification",
  description:
    "Identify pills instantly with AI-powered image recognition. Upload a photo and get detailed medication information.",
  generator: "v0.app",
  keywords: ["pill identification", "medication", "AI", "computer vision", "healthcare", "pharmacy"],
  authors: [{ name: "PillSnap Team" }],
  openGraph: {
    title: "PillSnap - AI-Powered Pill Identification",
    description: "Identify pills instantly with AI-powered image recognition",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
