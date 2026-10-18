import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers/providers";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { PwaInstallBanner } from "@/components/pwa/pwa-install-banner";

const ampleSoft = localFont({
  src: [
    {
      path: "../fonts/AmpleSoftPro/AmpleSoftPro-Thin.woff2",
      weight: "100",
      style: "normal",
    },
    {
      path: "../fonts/AmpleSoftPro/AmpleSoftPro-ExtraLight.woff2",
      weight: "200",
      style: "normal",
    },
    {
      path: "../fonts/AmpleSoftPro/AmpleSoftPro-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../fonts/AmpleSoftPro/AmpleSoftPro-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/AmpleSoftPro/AmpleSoftPro-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/AmpleSoftPro/AmpleSoftPro-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-ample-soft",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#030712" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "RoyalMotionIT – Distribute Your Music Worldwide",
  description:
    "Upload your tracks to Spotify, Apple Music, TikTok, and 150+ stores globally. Keep 100% of your earnings.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RMIT Music",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#030712",
    "msapplication-tap-highlight": "no",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${ampleSoft.variable}`}
    >
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="RMIT Music" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-TileColor" content="#030712" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
      </head>
      <body className="min-h-dvh antialiased">
        <Providers>
          {children}
          <PwaRegister />
          <PwaInstallBanner />
        </Providers>
      </body>
    </html>
  );
}
