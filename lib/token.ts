"use server";

let accessToken: string | null = null;
let tokenExpiry: number | null = null;

async function fetchNewToken() {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET.");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const res = await fetch(`https://id.twitch.tv/oauth2/token?${params}`, {
    method: "POST",
  });

  if (!res.ok) {
    const details = await res.text();
    throw new Error(`Twitch token request failed with status ${res.status}: ${details}`);
  }

  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!data.access_token || !data.expires_in) {
    throw new Error("Twitch token response did not include an access token.");
  }

  accessToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1000;

  return accessToken;
}

export async function getAccessToken() {
  if (!accessToken || !tokenExpiry || Date.now() >= tokenExpiry) {
    return fetchNewToken();
  }

  return accessToken;
}