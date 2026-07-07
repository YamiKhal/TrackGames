import type { Metadata } from "next";
import { absoluteUrl, DEFAULT_OG_IMAGE, metadataDescription, SITE_NAME } from "@/lib/util/metadata";

const description = metadataDescription("How TrackGames collects, uses, stores, shares and protects your personal data.");

export const metadata: Metadata = {
	title: "Privacy",
	description,
	alternates: {
		canonical: absoluteUrl("/privacy"),
	},
	openGraph: {
		title: `Privacy | ${SITE_NAME}`,
		description,
		url: absoluteUrl("/privacy"),
		siteName: SITE_NAME,
		type: "website",
		images: [
			{
				url: DEFAULT_OG_IMAGE,
				alt: SITE_NAME,
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: `Privacy | ${SITE_NAME}`,
		description,
		images: [DEFAULT_OG_IMAGE],
	},
};

export default function PrivacyPage() {
	return (
		<div className="flex flex-col gap-8">
			<header className="flex flex-col gap-3 border-b border-border pb-6">
				<h1 className="text-3xl font-bold">Privacy Policy</h1>
				<p className="text-sm text-text-muted">Last updated: July 7, 2026</p>
				<p className="text-text-muted">
					This Privacy Policy explains how TrackGames (&quot;we&quot;, &quot;us&quot; and &quot;our&quot;) collects, uses, stores, shares and protects information when
					you use our website and services. We wrote it in plain language so you can understand what happens to your data and what choices you have.
				</p>
				<p className="text-text-muted">
					TrackGames is the data controller for the personal data described in this policy. That means we decide why and how your personal data is processed. You can
					contact us about privacy at{" "}
					<a href="mailto:trackgames@yamikhal.com" className="text-primary hover:underline">
						trackgames@yamikhal.com
					</a>
					.
				</p>
			</header>

			<section className="flex flex-col gap-3">
				<h2 className="text-xl font-bold">1. Scope And Key Terms</h2>
				<p className="text-text-muted">
					This policy applies to TrackGames accounts, profiles, game tracking features, community features, feedback tools, support requests, analytics, logs, cookies,
					and related website features.
				</p>
				<p className="text-text-muted">
					&quot;Personal data&quot; means information that identifies you or can reasonably be linked to you, such as your email address, IP address, account profile,
					comments, or gameplay logs tied to your account. Some information, such as aggregated statistics about how many people use a feature, may not identify you. We
					treat account-linked activity as personal data when it can be connected back to your account.
				</p>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="text-xl font-bold">2. Data We Collect</h2>
				<p className="text-text-muted">We collect information in a few ways: when you provide it, when you use the service and when cookies or similar tools record it.</p>
				<ul className="flex flex-col gap-2 pl-5 text-text-muted">
					<li className="list-disc">
						Account data: email address, username, sign-in details, connected authentication providers, account identifiers and security-related records.
					</li>
					<li className="list-disc">
						Profile data: username, bio, avatar or profile images, profile styling choices, associated dates you add to your profile, social links and preference
						settings.
					</li>
					<li className="list-disc">
						Game and library data: games you add, statuses, lists, logs, game logs, manually entered gameplay times, play sessions, dates attached to logs, notes,
						ratings, reviews, tags and related tracking history.
					</li>
					<li className="list-disc">
						Community and interaction data: comments, likes, follows, reports, feedback, moderation messages, notifications and other interactions with users or
						content.
					</li>
					<li className="list-disc">
						Technical data: IP address, device and browser information, cookie identifiers, session information, pages viewed, features used, timestamps, referral
						information, error reports and usage logs.
					</li>
					<li className="list-disc">
						Analytics data: information about how people use TrackGames, such as page views, navigation paths, feature usage, approximate location derived from IP
						address and performance events.
					</li>
					<li className="list-disc">Support and contact data: messages you send us, feedback you provide, reports you submit and information needed to respond.</li>
				</ul>
				<p className="text-text-muted">
					We do not intentionally collect special-category data such as health information, political opinions, religious beliefs, or biometric data. Please do not put
					that kind of information in your profile, comments, reports, feedback, or game notes.
				</p>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="text-xl font-bold">3. How We Use Your Data</h2>
				<p className="text-text-muted">We use your data for the following purposes:</p>
				<ul className="flex flex-col gap-2 pl-5 text-text-muted">
					<li className="list-disc">To create, maintain, secure and authenticate your account.</li>
					<li className="list-disc">To display your profile, game library, logs, lists, reviews, comments, likes and other features you choose to use.</li>
					<li className="list-disc">To save preferences such as display settings, privacy settings, content settings and interface choices.</li>
					<li className="list-disc">To provide community features, notifications, reporting tools, moderation and abuse prevention.</li>
					<li className="list-disc">To respond to feedback, support requests, bug reports and legal or safety concerns.</li>
					<li className="list-disc">To understand how TrackGames is used, improve performance, fix errors, develop features and measure service health.</li>
					<li className="list-disc">To detect, investigate and prevent spam, scraping, security incidents, fraud, policy violations and unlawful activity.</li>
					<li className="list-disc">To comply with legal obligations, enforce our Terms of Service and protect our users, service and rights.</li>
				</ul>
				<p className="text-text-muted">
					Some content is visible to other users or the public depending on the feature and your settings. For example, public profiles, public game logs, comments, likes
					and other public interactions may be shown to other people. Private account details, such as your email address, are not shown publicly by default.
				</p>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="text-xl font-bold">4. Legal Basis For Processing</h2>
				<p className="text-text-muted">If the GDPR applies to you, we need a legal basis to process your personal data. We rely on the following bases:</p>
				<ul className="flex flex-col gap-2 pl-5 text-text-muted">
					<li className="list-disc">
						Contract: we process account data, profile settings, library data, logs, gameplay times, comments, likes and other feature data so we can provide the
						TrackGames service you request.
					</li>
					<li className="list-disc">
						Legitimate interests: we process technical data, logs, analytics, reports, feedback, moderation records and security records to operate, improve, protect,
						and troubleshoot TrackGames. We balance these interests against your privacy rights.
					</li>
					<li className="list-disc">
						Consent: we rely on consent where required, such as for optional non-essential cookies, optional analytics (including Google Analytics), or advertising and
						personalization where applicable. You can withdraw consent at any time and withdrawal does not affect processing that happened before withdrawal.
					</li>
					<li className="list-disc">
						Legal obligation: we process and retain data when needed to comply with law, respond to valid legal requests, preserve required records, or handle rights
						requests.
					</li>
					<li className="list-disc">
						Vital or public interests: these will rarely apply, but we may process limited information if needed to protect someone&apos;s safety or comply with an
						urgent lawful requirement.
					</li>
				</ul>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="text-xl font-bold">5. Cookies, Analytics and Tracking</h2>
				<p className="text-text-muted">
					We use cookies, local storage and similar technologies to keep TrackGames working and to understand how the service is used. Cookies are small files stored on
					your device. Local storage is browser storage that can remember settings on the same device.
				</p>
				<ul className="flex flex-col gap-2 pl-5 text-text-muted">
					<li className="list-disc">Essential cookies keep you signed in, maintain sessions, support authentication and protect against abuse.</li>
					<li className="list-disc">Preference storage remembers choices such as theme, display settings, cookie choices, or other interface preferences.</li>
					<li className="list-disc">
						Analytics help us understand page views, feature usage, performance, errors and general service health. This includes our own privacy-friendly, cookieless
						analytics and, with your consent, Google Analytics.
					</li>
					<li className="list-disc">
						Advertising: we do not currently show ads, but we may use Google advertising and measurement products (such as Google Ads) in the future. Any advertising or
						personalization cookies are used only with your consent.
					</li>
					<li className="list-disc">Security logs may record IP addresses, device data, timestamps and request details to detect abuse or suspicious activity.</li>
				</ul>
				<p className="text-text-muted">
					When you first visit, we ask for your cookie choices through a consent banner and you can change or withdraw them at any time from the &quot;Cookie
					preferences&quot; link in the footer or the Data tab in your account settings. You can also control cookies through your browser settings. Blocking essential
					cookies may prevent sign-in or core features from working.
				</p>
				<p className="text-text-muted">
					Google Analytics runs under Google Consent Mode v2: until you opt in, it loads without advertising or analytics cookies and receives only aggregated, cookieless
					signals and granting consent enables full analytics measurement.
				</p>
				<p className="text-text-muted">
					We do not sell your personal data. We do not use your personal data for third-party behavioral advertising without your consent and we only enable advertising
					or personalization cookies if you opt in.
				</p>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="text-xl font-bold">6. Third-Party Sharing</h2>
				<p className="text-text-muted">
					We share data only when needed to run TrackGames, provide features, comply with law, or protect the service. Depending on how you use TrackGames, recipients may
					include:
				</p>
				<ul className="flex flex-col gap-2 pl-5 text-text-muted">
					<li className="list-disc">Hosting, database, storage, logging, analytics, security and infrastructure providers.</li>
					<li className="list-disc">
						Analytics and advertising providers, including Google (Google Analytics and Google Ads if enabled in the future), which may process data in the United
						States.
					</li>
					<li className="list-disc">Email, authentication, support and communication providers.</li>
					<li className="list-disc">Game data or media providers whose content is displayed in the service, such as IGDB or embedded video providers.</li>
					<li className="list-disc">Moderation or abuse-prevention tools, where needed to review reports and protect users.</li>
					<li className="list-disc">Law enforcement, courts, regulators, or other parties when legally required or necessary to protect rights, safety, or security.</li>
					<li className="list-disc">A successor organization if TrackGames is involved in a merger, acquisition, reorganization, or transfer of assets.</li>
				</ul>
				<p className="text-text-muted">
					When third-party content loads, the provider may receive technical request information such as your IP address, browser information and the page where the
					content appears. Their own privacy policies apply to their processing.
				</p>
				<p className="text-text-muted">
					Some providers may process data outside your country, including outside the European Economic Area. When GDPR transfer rules apply, we use appropriate
					safeguards where required, such as standard contractual clauses, adequacy decisions, or another lawful transfer mechanism.
				</p>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="text-xl font-bold">7. Data Retention</h2>
				<p className="text-text-muted">
					We keep personal data only as long as reasonably needed for the purposes described in this policy, unless a longer period is required or allowed by law. Our
					retention periods depend on the type of data, your choices, legal requirements and operational needs.
				</p>
				<ul className="flex flex-col gap-2 pl-5 text-text-muted">
					<li className="list-disc">
						Account, profile, settings, game library, logs, comments, likes and similar account data are usually kept while your account exists.
					</li>
					<li className="list-disc">
						Public content may remain visible until you delete it, change its visibility, or delete your account, subject to moderation and backups.
					</li>
					<li className="list-disc">
						Security logs, access logs, analytics records and error logs are kept for a limited period needed for security, debugging and service health.
					</li>
					<li className="list-disc">
						Reports, feedback, support messages and moderation records may be kept longer where needed to resolve disputes or prevent repeated abuse.
					</li>
					<li className="list-disc">Backups may keep deleted data for a limited time until they rotate out in the ordinary backup cycle.</li>
					<li className="list-disc">
						Records needed for legal compliance, rights requests, accounting, disputes, or enforcement may be kept as long as necessary for that purpose.
					</li>
				</ul>
				<p className="text-text-muted">
					When you delete your account or request deletion, we will delete or anonymize personal data that is no longer needed. We may keep limited information where the
					law allows or requires it, such as security records, moderation history, records of your request, or data needed to defend legal claims. Deletion from active
					systems is usually completed within a reasonable operational period, while backup copies are removed through normal backup rotation.
				</p>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="text-xl font-bold">8. Our Ability To Manage Data</h2>
				<p className="text-text-muted">
					We may access, review, process, restrict, hide, modify, move, anonymize, or delete data when reasonably necessary to operate TrackGames, maintain security,
					enforce our Terms of Service, correct technical issues, respond to your requests, comply with law, prevent abuse, or protect users and the service.
				</p>
				<p className="text-text-muted">
					This does not mean we can ignore your rights. We will use this discretion within the limits of applicable law, including GDPR. We will not use it to remove
					rights you have under data protection law and we will assess deletion, correction, objection and restriction requests fairly.
				</p>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="text-xl font-bold">9. Data Security</h2>
				<p className="text-text-muted">
					We use technical and organizational measures designed to protect personal data against unauthorized access, loss, misuse, alteration and disclosure. These
					measures include access controls, authentication safeguards, encryption in transit where supported, secure password handling, logging, backups and limiting
					access to people and providers who need it.
				</p>
				<p className="text-text-muted">
					No online service is perfectly secure. You can help protect your account by using a strong password, keeping sign-in credentials private and telling us if you
					think your account or data has been compromised.
				</p>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="text-xl font-bold">10. Your Choices And GDPR Rights</h2>
				<p className="text-text-muted">
					You can use account settings and feature controls to update profile details, change preferences, adjust visibility and delete content where available.
				</p>
				<p className="text-text-muted">If the GDPR applies to you, you also have the following rights under Articles 15 to 21:</p>
				<ul className="flex flex-col gap-2 pl-5 text-text-muted">
					<li className="list-disc">Access: ask for a copy of your personal data and information about how we process it.</li>
					<li className="list-disc">Rectification: ask us to correct inaccurate or incomplete personal data.</li>
					<li className="list-disc">Erasure: ask us to delete personal data, subject to exceptions such as legal obligations, security needs, or legal claims.</li>
					<li className="list-disc">Restriction: ask us to limit how we process certain personal data in specific circumstances.</li>
					<li className="list-disc">Portability: ask for certain data you provided to us in a structured, commonly used, machine-readable format.</li>
					<li className="list-disc">
						Objection: object to processing based on legitimate interests, including certain analytics or security processing where applicable.
					</li>
					<li className="list-disc">Withdraw consent: withdraw consent for processing based on consent, without affecting processing that happened before withdrawal.</li>
				</ul>
				<p className="text-text-muted">
					To exercise these rights, email us at{" "}
					<a href="mailto:trackgames@yamikhal.com" className="text-primary hover:underline">
						trackgames@yamikhal.com
					</a>
					. We may need to verify your identity before responding. We will respond within the timeframe required by law. If we cannot fully honor a request, we will
					explain why, unless the law prevents us from doing so.
				</p>
				<p className="text-text-muted">
					You also have the right to lodge a complaint with a data protection supervisory authority, especially in the EU or EEA country where you live, work, or believe
					an issue occurred. We would appreciate the chance to address your concern first, but you do not have to contact us before contacting a regulator.
				</p>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="text-xl font-bold">11. Children</h2>
				<p className="text-text-muted">
					TrackGames is not directed to children under 13 and we do not knowingly collect personal data from them. If you believe a child has provided personal data to
					us, contact us and we will take appropriate steps. If local law requires a higher minimum age for consent to online services, you must meet that age or have
					valid parental consent.
				</p>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="text-xl font-bold">12. Automated Decisions</h2>
				<p className="text-text-muted">
					We do not make decisions based solely on automated processing that produce legal effects or similarly significant effects for you. We may use automated signals,
					rules, or logs to detect spam, abuse, security risks, or technical issues, but important account or moderation decisions may be reviewed by a person where
					appropriate.
				</p>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="text-xl font-bold">13. Changes To This Policy</h2>
				<p className="text-text-muted">
					We may update this Privacy Policy as TrackGames changes, as our data practices change, or as legal requirements evolve. When we update it, we will change the
					&quot;Last updated&quot; date above. If a change is material, we will take reasonable steps to notify you, such as by posting a notice on the website or sending
					an account notice when appropriate.
				</p>
				<p className="text-text-muted">
					Your continued use of TrackGames after an updated policy takes effect means the updated policy applies to later use of the service. If a change requires your
					consent, we will ask for it.
				</p>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="text-xl font-bold">14. Contact Information</h2>
				<p className="text-text-muted">For privacy questions, rights requests, complaints, or security concerns, contact:</p>
				<ul className="flex flex-col gap-2 pl-5 text-text-muted">
					<li className="list-disc">Controller: TrackGames</li>
					<li className="list-disc">
						Email:{" "}
						<a href="mailto:trackgames@yamikhal.com" className="text-primary hover:underline">
							trackgames@yamikhal.com
						</a>
					</li>
				</ul>
				<p className="text-text-muted">
					You can also reach us through the{" "}
					<a href="/contact" className="text-primary hover:underline">
						contact page
					</a>
					.
				</p>
			</section>
		</div>
	);
}
