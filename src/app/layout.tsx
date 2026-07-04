import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { absoluteUrl, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, SITE_NAME } from "@/lib/util/metadata";

import "./globals.css";

export const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
});

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
	title: {
		default: SITE_NAME,
		template: `%s | ${SITE_NAME}`,
	},
	description: DEFAULT_DESCRIPTION,
	applicationName: SITE_NAME,
	authors: [{ name: SITE_NAME }],
	creator: SITE_NAME,
	publisher: SITE_NAME,
	category: "games",
	keywords: ["game library", "game tracker", "video games", "playlists", "backlog", "ratings", "gaming profile", "track games", "trending games", "game journal", "game logs"],
	referrer: "origin-when-cross-origin",
	manifest: absoluteUrl("/site.webmanifest"),
	alternates: {
		canonical: absoluteUrl("/"),
	},
	openGraph: {
		type: "website",
		locale: "en_US",
		url: absoluteUrl("/"),
		siteName: SITE_NAME,
		title: SITE_NAME,
		description: DEFAULT_DESCRIPTION,
		images: [
			{
				url: DEFAULT_OG_IMAGE,
				alt: SITE_NAME,
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: SITE_NAME,
		description: DEFAULT_DESCRIPTION,
		images: [DEFAULT_OG_IMAGE],
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-image-preview": "large",
			"max-snippet": -1,
			"max-video-preview": -1,
		},
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={`dark ${inter.variable} ${manrope.variable} h-full antialiased`}>
			<body className="flex h-full min-h-96 flex-col" suppressHydrationWarning>
				<Header />
				{children}
				<Footer />
			</body>
		</html>
	);
}
