import RequestQueue from "../cache/RequestQueue";
import { getAccessToken } from "../token";

const API = "https://api.igdb.com/v4/";
const queue = new RequestQueue(3, 1100);


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

        throw new Error(
            `Games API (${API}${endpoint}) request failed with status ${result.status}\nError:\n${errorText}`
        );
    }

    return result.json();
}

// Queued up fetching function to respect rate limits
export async function fetchAPI<T>(endpoint: string, query: string): Promise<T> {
    return queue.run(() => freeFetch<T>(endpoint, query));
}