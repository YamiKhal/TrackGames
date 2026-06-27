import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const SITE_NAME = "TrackGames";
const DESCRIPTION =
  "Track, organize and rate your games. Build playlists, customize your profile, and share your games with friends.";
const SITE_URL = "trackgames.app";

export const alt = SITE_NAME;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const icon = await readFile(
    join(process.cwd(), "app/android-chrome-512x512.png"),
  );
  const iconSrc = `data:image/png;base64,${icon.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: "#14151a",
        color: "#F4F0FF",
        padding: "76px 96px",
        fontFamily: "Inter, Manrope, Arial, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: "58px",
          bottom: "72px",
          width: "26px",
          height: "430px",
          borderRadius: "999px",
          background: "#9A7BFF",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "66px",
          bottom: "106px",
          width: "10px",
          height: "362px",
          borderRadius: "999px",
          background: "#14151a",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "58px",
          bottom: "72px",
          width: "660px",
          height: "26px",
          borderRadius: "999px",
          background: "#9A7BFF",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "92px",
          bottom: "80px",
          width: "558px",
          height: "10px",
          borderRadius: "999px",
          background: "#14151a",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "42px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <img
            src={iconSrc}
            width="88"
            height="88"
            alt=""
            style={{
              width: "88px",
              height: "88px",
              borderRadius: "22px",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "row"
            }}
          >
            <div
              style={{
                fontSize: "58px",
                lineHeight: 1,
                fontWeight: 800,
                letterSpacing: "0",
                color: "#F4F0FF",
              }}
            >
              Track
            </div>
            <div
              style={{
                fontSize: "58px",
                lineHeight: 1,
                fontWeight: 800,
                letterSpacing: "0",
                color: "#9A7BFF",
              }}
            >
              Games
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "22px",
            maxWidth: "850px",
            paddingLeft: "112px",
          }}
        >
          <div
            style={{
              fontSize: "66px",
              lineHeight: 1.03,
              fontWeight: 800,
              letterSpacing: "0",
              color: "#F4F0FF",
            }}
          >
            Build Your Library :)
          </div>
          <div
            style={{
              fontSize: "27px",
              lineHeight: 1.38,
              color: "#B9B5C9",
              maxWidth: "760px",
            }}
          >
            {DESCRIPTION}
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: "96px",
          bottom: "76px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          color: "#D6A85C",
          fontSize: "28px",
          fontWeight: 800,
        }}
      >
        <div
          style={{
            width: "44px",
            height: "4px",
            borderRadius: "999px",
            background: "#D6A85C",
          }}
        />
        {SITE_URL}
      </div>
    </div>,
    size,
  );
}
