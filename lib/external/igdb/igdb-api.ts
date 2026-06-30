import RequestQueue from "@/lib/cache/requestQueue";
import { getAccessToken } from "../../token";

const queue = new RequestQueue(3, 1100);

const API = "https://api.igdb.com/v4/";

async function freeFetch<T>(endpoint: string, query: string): Promise<T> {
	const token = await getAccessToken();

	const result = await fetch(`${API}${endpoint}`, {
		method: "POST",
		headers: {
			"Client-ID": process.env.TWITCH_CLIENT_ID!,
			Authorization: `Bearer ${token}`,
		},
		body: query,
	});

	if (!result.ok) {
		const errorText = await result.text();

		throw new Error(`Games API (${API}${endpoint}) request failed with status ${result.status}\nError:\n${errorText}`);
	}

	return result.json();
}

export async function fetchAPI<T>(endpoint: string, query: string): Promise<T> {
	return queue.run(() => freeFetch<T>(endpoint, query));
}
