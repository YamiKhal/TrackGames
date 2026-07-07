// Shared cookie-consent state. Used by the consent banner and the Data settings tab,
// so both read/write the same store and push the same Google Consent Mode v2 signals.

export const CONSENT_STORAGE_KEY = "tg-cookie-consent";

// Essential cookies (auth/session) are always on and never represented here — only
// the optional categories the visitor can toggle.
export type ConsentChoice = { analytics: boolean; ads: boolean };

declare global {
	interface Window {
		gtag?: (...args: unknown[]) => void;
	}
}

export function readConsent(): ConsentChoice | null {
	try {
		const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		return { analytics: Boolean(parsed.analytics), ads: Boolean(parsed.ads) };
	} catch {
		return null;
	}
}

// Persist the choice and tell Google Analytics about it. With Consent Mode v2 the GA
// tag is already loaded (denied by default), so this only flips the relevant signals —
// no page reload, and cookieless "modeled" data keeps flowing when a category is denied.
export function applyConsent(choice: ConsentChoice) {
	localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(choice));
	window.gtag?.("consent", "update", {
		analytics_storage: choice.analytics ? "granted" : "denied",
		ad_storage: choice.ads ? "granted" : "denied",
		ad_user_data: choice.ads ? "granted" : "denied",
		ad_personalization: choice.ads ? "granted" : "denied",
	});
}
