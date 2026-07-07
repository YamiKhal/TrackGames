"use client";

// Re-opens the consent banner so a visitor can change or withdraw their cookie
// choice at any time (a GDPR requirement: withdrawal must be as easy as consent).
export default function CookiePreferencesButton() {
	return (
		<button
			type="button"
			onClick={() => window.dispatchEvent(new Event("tg:open-cookie-preferences"))}
			className="cursor-pointer text-text-faint transition-colors hover:text-text"
		>
			Cookie preferences
		</button>
	);
}
