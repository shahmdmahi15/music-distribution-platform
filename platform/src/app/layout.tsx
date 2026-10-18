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
    title: "RMIT Platform",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
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
