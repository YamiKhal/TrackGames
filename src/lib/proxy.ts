import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Coarse, cosmetic gate only: bounce logged-out visitors before the admin pages render.
// Real authorization (ADMIN role + password reauth) lives in `requireAdmin()`.
export function proxy(request: NextRequest) {
	const hasSession = request.cookies.has("authjs.session-token") || request.cookies.has("__Secure-authjs.session-token");

	if (!hasSession) {
		const url = new URL("/login", request.url);
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*", "/members/:path*"],
};
