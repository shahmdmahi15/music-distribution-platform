import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers/providers";

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

export const metadata: Metadata = {
  title: "RoyalMotionIT – Distribute Your Music Worldwide",
  description:
    "Upload your tracks to Spotify, Apple Music, TikTok, and 150+ stores globally. Keep 100% of your earnings.",
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
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
