import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { site, siteUrl } from "@/data/site";
import "./globals.css";

const display = localFont({
  src: [
    { path: "../public/fonts/newsreader-latin-variable.woff2", weight: "200 800", style: "normal" },
    { path: "../public/fonts/newsreader-latin-italic-variable.woff2", weight: "200 800", style: "italic" },
  ],
  variable: "--font-display",
  display: "optional",
  adjustFontFallback: "Times New Roman",
  fallback: ["Times New Roman", "serif"],
});

const sans = localFont({
  src: "../public/fonts/figtree-latin-variable.woff2",
  weight: "300 900",
  style: "normal",
  variable: "--font-sans",
  display: "optional",
  adjustFontFallback: "Arial",
  fallback: ["Arial", "sans-serif"],
});

const absoluteUrl = siteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl),
  title: {
    default: site.name,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.shortName,
  keywords: [...site.keywords],
  openGraph: {
    type: "website",
    locale: site.locale,
    url: absoluteUrl,
    siteName: site.name,
    title: site.name,
    description: site.shareDescription,
    images: [
      {
        url: site.ogImage.path,
        width: site.ogImage.width,
        height: site.ogImage.height,
        alt: site.ogAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.shareDescription,
    images: [
      {
        url: site.ogImage.path,
        width: site.ogImage.width,
        height: site.ogImage.height,
        alt: site.ogAlt,
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: site.shortName,
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#171411",
  colorScheme: "light",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: site.name,
  url: absoluteUrl,
  description: site.description,
  inLanguage: "en-IL",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IL">
      <body className={`${display.variable} ${sans.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
