import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Instrument_Serif, DM_Sans } from "next/font/google";
import "./globals.css";

// ── Fonts ───────────────────────────────────────────────────────────────────

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

// Display + body fonts — loaded via next/font instead of render-blocking @import
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-body",
  display: "swap",
});

// ── Viewport ────────────────────────────────────────────────────────────────

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FAFAF8",
};

// ── Metadata ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "Deep Cut — Name the Artist",
    template: "%s | Deep Cut",
  },
  description:
    "Songs reveal one at a time — deep cuts first, hits last. Guess the artist before time runs out. How deep is your music knowledge?",
  // Uncomment and set your deployed URL:
  // metadataBase: new URL("https://your-app.vercel.app"),
  manifest: "/manifest.json",
  openGraph: {
    title: "Deep Cut — Name the Artist",
    description:
      "Songs reveal one at a time. Guess the artist. The earlier you guess, the higher your score.",
    siteName: "Deep Cut",
    type: "website",
    locale: "en_US",
    // url: "https://your-app.vercel.app",
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
    // images: ["https://your-app.vercel.app/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // Uncomment when deployed:
  // alternates: {
  //   canonical: "https://your-app.vercel.app",
  // },
};

// ── JSON-LD Structured Data ─────────────────────────────────────────────────

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Deep Cut",
  description:
    "A music trivia game where songs reveal one at a time — deep cuts first, hits last. Guess the artist before time runs out.",
  // url: "https://your-app.vercel.app",
  applicationCategory: "GameApplication",
  genre: "Music Trivia",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  inLanguage: "en",
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      // item: "https://your-app.vercel.app",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Play",
      // item: "https://your-app.vercel.app/play",
    },
  ],
};

// ── Layout ──────────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([webAppSchema, breadcrumbSchema]),
          }}
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className={`
          ${geistSans.variable} ${geistMono.variable}
          ${instrumentSerif.variable} ${dmSans.variable}
          antialiased bg-[#FAFAF8] overflow-x-hidden
        `}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50
            focus:px-4 focus:py-2 focus:bg-[#b45309] focus:text-white focus:rounded-md focus:text-sm focus:font-medium"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
