export const CONSENT_STORAGE_KEY = "tg-cookie-consent";
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
export function applyConsent(choice: ConsentChoice) {
	localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(choice));
	window.gtag?.("consent", "update", {
		analytics_storage: choice.analytics ? "granted" : "denied",
		ad_storage: choice.ads ? "granted" : "denied",
		ad_user_data: choice.ads ? "granted" : "denied",
		ad_personalization: choice.ads ? "granted" : "denied",
	});
}
