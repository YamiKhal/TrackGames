"use server";

import * as zod from "zod";
import { auth, OAUTH_USERNAME_COOKIE, signIn, signOut } from "../auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import db from "../db";
import { hashPassword } from "../util/password";
import { Prisma } from "../generated/prisma/client";
import { cookies } from "next/headers";
import { USERNAME_ERROR, usernameSchema } from "../account/username";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

type AuthActionResult = {
	error?: string;
	fieldErrors?: {
		name?: string;
		email?: string;
		password?: string;
		passwordConfirm?: string;
	};
};

const loginProviders = new Set(["google", "github", "twitch", "discord"]);

const SIGN_IN_REDIRECT = "/";
const ACCOUNT_SETTINGS_REDIRECT = "/settings?tab=account";
const MIN_PASSWORD_LENGTH = 8;

function getErrorObject(error: PrismaClientKnownRequestError) {
	const target = Array.isArray(error.meta?.target) ? error.meta.target : [];
	return {
		error: "Please fix the highlighted fields.",
		fieldErrors: target.includes("name") ? { name: "That username is already in use." } : { email: "An account already exists for this email." },
	};
}

export async function logout() {
	await signOut();
}

export async function loginProvider(provider: string, formData?: FormData): Promise<AuthActionResult> {
	const session = await auth();
	if (session?.user) {
		redirect(SIGN_IN_REDIRECT);
	}

	if (!loginProviders.has(provider)) {
		redirect("/login?error=OAuthSignInError");
	}

	const cookieStore = await cookies();
	const mode = formData?.get("mode");

	if (mode === "register") {
		const name = usernameSchema.safeParse(formData?.get("name"));

		if (!name.success) {
			return {
				error: "Enter a username before registering with a provider.",
				fieldErrors: { name: USERNAME_ERROR },
			};
		}

		const existingName = await db.user.findFirst({
			where: { name: name.data },
			select: { id: true },
		});

		if (existingName) {
			return {
				error: "That username is already in use.",
				fieldErrors: { name: "That username is already in use." },
			};
		}

		cookieStore.set(OAUTH_USERNAME_COOKIE, name.data, {
			httpOnly: true,
			sameSite: "lax",
			path: "/",
			maxAge: 10 * 60,
		});
	} else {
		cookieStore.delete(OAUTH_USERNAME_COOKIE);
	}

	await signIn(provider, { redirectTo: SIGN_IN_REDIRECT });

	return {};
}

export async function linkProvider(provider: string) {
	const session = await auth();

	if (!session?.user) {
		redirect("/login");
	}

	if (!loginProviders.has(provider)) {
		redirect(`${ACCOUNT_SETTINGS_REDIRECT}&error=invalid-provider`);
	}

	await signIn(provider, { redirectTo: `${ACCOUNT_SETTINGS_REDIRECT}&saved=1` });
}

export async function unlinkProvider(provider: string) {
	const session = await auth();

	if (!session?.user?.id) {
		redirect("/login");
	}

	if (!loginProviders.has(provider)) {
		redirect(`${ACCOUNT_SETTINGS_REDIRECT}&error=invalid-provider`);
	}

	const user = await db.user.findUnique({
		where: { id: session.user.id },
		select: {
			email: true,
			passwordHash: true,
			accounts: {
				select: { id: true, provider: true },
			},
		},
	});

	if (!user) {
		redirect("/login");
	}

	const linkedProvider = user.accounts.find((account) => account.provider === provider);

	if (!linkedProvider) {
		redirect(`${ACCOUNT_SETTINGS_REDIRECT}&error=invalid-provider`);
	}

	const hasCredentialsLogin = Boolean(user.email && user.passwordHash);
	const remainingProviders = user.accounts.filter((account) => account.provider !== provider).length;

	if (!hasCredentialsLogin && remainingProviders === 0) {
		redirect(`${ACCOUNT_SETTINGS_REDIRECT}&error=last-login`);
	}

	await db.account.delete({
		where: { id: linkedProvider.id },
	});

	redirect(`${ACCOUNT_SETTINGS_REDIRECT}&saved=1`);
}

export async function login(formData: FormData): Promise<AuthActionResult> {
	const session = await auth();
	if (session?.user) {
		redirect(SIGN_IN_REDIRECT);
	}

	const email = zod.email().safeParse(formData.get("email"));
	const password = zod.string().safeParse(formData.get("password"));

	if (!email.success || !password.success || password.data?.length === 0 || password.data?.length > 128) {
		return { error: "Invalid email or password." };
	}

	try {
		await signIn("credentials", {
			email: email.data,
			password: password.data,
			redirectTo: SIGN_IN_REDIRECT,
		});
	} catch (error) {
		if (error instanceof AuthError) {
			return { error: "Invalid email or password." };
		}

		throw error;
	}

	return {};
}

export async function signup(formData: FormData): Promise<AuthActionResult> {
	const session = await auth();
	if (session?.user) {
		redirect(SIGN_IN_REDIRECT);
	}

	const name = usernameSchema.safeParse(formData.get("name"));
	const email = zod.email().safeParse(formData.get("email"));
	const password = zod.string().safeParse(formData.get("password"));
	const passwordConfirm = zod.string().safeParse(formData.get("passwordConfirm"));

	if (!name.success) {
		return {
			error: "Please fix the highlighted fields.",
			fieldErrors: { name: USERNAME_ERROR },
		};
	}

	if (!email.success) {
		return {
			error: "Please fix the highlighted fields.",
			fieldErrors: { email: "Enter a valid email address." },
		};
	}

	if (!password.success || password.data.length < MIN_PASSWORD_LENGTH || password.data.length > 128) {
		return {
			error: "Please fix the highlighted fields.",
			fieldErrors: { password: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
		};
	}

	if (!passwordConfirm.success || password.data !== passwordConfirm.data) {
		return {
			error: "Please fix the highlighted fields.",
			fieldErrors: { passwordConfirm: "Passwords don't match." },
		};
	}

	const existingEmail = await db.user.findUnique({
		where: { email: email.data },
		select: { id: true },
	});

	const existingName = await db.user.findFirst({
		where: { name: name.data },
		select: { id: true },
	});

	if (existingEmail) {
		return {
			error: "Please fix the highlighted fields.",
			fieldErrors: { email: "An account already exists for this email." },
		};
	}

	if (existingName) {
		return {
			error: "Please fix the highlighted fields.",
			fieldErrors: { name: "That username is already in use." },
		};
	}

	try {
		await db.user.create({
			data: {
				name: name.data,
				email: email.data,
				passwordHash: await hashPassword(password.data),
			},
		});
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
			return getErrorObject(error);
		}

		throw error;
	}

	try {
		await signIn("credentials", {
			email: email.data,
			password: password.data,
			redirectTo: SIGN_IN_REDIRECT,
		});
	} catch (error) {
		if (error instanceof AuthError) {
			return { error: "Your account was created. Please log in." };
		}

		throw error;
	}

	return {};
}
