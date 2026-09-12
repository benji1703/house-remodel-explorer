import type { Metadata, Viewport } from "next";
import { Figtree, Newsreader } from "next/font/google";
import { site, siteUrl } from "@/data/site";
import "./globals.css";

const display = Newsreader({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const sans = Figtree({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
  themeColor: "#d8c8b0",
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
