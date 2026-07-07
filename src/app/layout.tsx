import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";
import AnalyticsTracker from "@/components/analytics/AnalyticsTracker";
import ConsentBanner from "@/components/analytics/ConsentBanner";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { absoluteUrl, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, SITE_NAME } from "@/lib/util/metadata";

import "./globals.css";

export const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
});

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const gaId = process.env.GA_ID;

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
				{gaId && (
					<>
						{/* Consent Mode v2: everything denied by default so GA loads without cookies and
						    still sends modeled data, then ConsentBanner flips signals on opt-in. Must run
						    before the GA tag, hence beforeInteractive. */}
						<Script id="google-consent-default" strategy="beforeInteractive">
							{`window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments);};gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});gtag('set','url_passthrough',true);gtag('set','ads_data_redaction',true);`}
						</Script>
						<GoogleAnalytics gaId={gaId} />
						<ConsentBanner />
					</>
				)}
				<AnalyticsTracker />
				<Header />
				{children}
				<Footer />
			</body>
		</html>
	);
}
