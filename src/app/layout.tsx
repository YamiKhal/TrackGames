import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import Script from "next/script";
import ConsentBanner from "@/components/analytics/ConsentBanner";
import GaPageview from "@/components/analytics/GaPageview";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { absoluteUrl, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, SITE_NAME } from "@/lib/util/metadata";

import "./globals.css";

export const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
});

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const gaId = process.env.GA_ID!;

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
				<Script id="google-consent-default" strategy="beforeInteractive">
					{`
						window.dataLayer=window.dataLayer || [];
						window.gtag = function() {dataLayer.push(arguments);};
						gtag('consent', 'default', {
							ad_storage:'denied',
							ad_user_data:'denied',
							ad_personalization:'denied',
							analytics_storage:'denied',
							functionality_storage:'granted',
							security_storage:'granted'
						});
						gtag('set', 'url_passthrough', true);
						gtag('set', 'ads_data_redaction', true);
					`}
				</Script>
				<Script id="ga-src" src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
				<Script id="ga-config" strategy="afterInteractive">
					{`
						gtag('js', new Date());
						// Automatic page_view off — GaPageview sends normalized paths instead.
						gtag('config', '${gaId}', { send_page_view: false });
					`}
				</Script>
				<GaPageview />
				<ConsentBanner />
				<Header />
				{children}
				<Footer />
			</body>
		</html>
	);
}
