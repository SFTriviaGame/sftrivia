import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Deep Cut — Name the Artist",
  description:
    "Songs reveal one at a time — deep cuts first, hits last. Guess the artist before time runs out. How deep is your music knowledge?",
  openGraph: {
    title: "Deep Cut — Name the Artist",
    description:
      "Songs reveal one at a time. Guess the artist. The earlier you guess, the higher your score.",
    siteName: "Deep Cut",
    type: "website",
    locale: "en_US",
    // Add your deployed URL here:
    // url: "https://your-app.vercel.app",
    // Add an OG image (1200x630 recommended):
    // images: [
    //   {
    //     url: "https://your-app.vercel.app/og.png",
    //     width: 1200,
    //     height: 630,
    //     alt: "Deep Cut — Name the Artist",
    //   },
    // ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deep Cut — Name the Artist",
    description:
      "Songs reveal one at a time. Guess the artist. How deep is your music knowledge?",
    // image: "https://your-app.vercel.app/og.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#FAFAF8] overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
