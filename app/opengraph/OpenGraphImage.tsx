import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { resolveStillImage } from "@/lib/util/image";
import { hexColor } from "@/lib/util/normalize";

type OpenGraphImageProps = {
	title: string;
	description: string;
	label?: string;
	image?: string | null;
	coverImage?: string | null;
	libraryGameCount?: number;
	playlistGameCount?: number;
	primaryColor?: string | null;
	playlistImages?: string[];
	variant?: "site" | "game" | "profile" | "library" | "playlist";
};

export const size = {
	width: 1200,
	height: 630,
};

export async function createOpenGraphImage({
	title,
	description,
	label = "TrackGames",
	image,
	coverImage,
	libraryGameCount,
	playlistGameCount,
	primaryColor,
	playlistImages = [],
	variant = "site",
}: OpenGraphImageProps) {
	const icon = await readFile(join(process.cwd(), "app/android-chrome-512x512.png"));
	const iconSrc = `data:image/png;base64,${icon.toString("base64")}`;
	const imageSrc = await resolveStillImage(image);
	const coverSrc = await resolveStillImage(coverImage);
	const dissolveColor = hexColor(primaryColor, "#9A7BFF");
	const dissolveRgb = `${Number.parseInt(dissolveColor.slice(1, 3), 16)}, ${Number.parseInt(dissolveColor.slice(3, 5), 16)}, ${Number.parseInt(dissolveColor.slice(5, 7), 16)}`;
	const titleSize = title.length > 42 ? "54px" : "64px";
	const brand = (
		<div style={{ display: "flex", alignSelf: "flex-start", alignItems: "center", gap: "18px" }}>
			<img src={iconSrc} width="72" height="72" alt="" style={{ width: "72px", height: "72px", borderRadius: "18px" }} />
			<div style={{ display: "flex", fontSize: "46px", lineHeight: 1, fontWeight: 800 }}>
				<div style={{ color: "#F4F0FF" }}>Track</div>
				<div style={{ color: "#9A7BFF" }}>Games</div>
			</div>
		</div>
	);
	const dissolveBackground = (
		<div style={{ position: "absolute", left: 0, top: 0, width: "1200px", height: "630px", display: "flex" }}>
			<div style={{ position: "absolute", right: 0, top: 0, width: "260px", height: "100%", background: dissolveColor }} />
			<div
				style={{
					position: "absolute",
					right: "260px",
					top: 0,
					width: "260px",
					height: "100%",
					background: `linear-gradient(90deg, rgba(${dissolveRgb}, 0) 0%, rgba(${dissolveRgb}, 0.4) 62%, ${dissolveColor} 100%)`,
				}}
			/>
			{[
				{ right: 372, top: 42, size: 76, opacity: 1 },
				{ right: 500, top: 82, size: 52, opacity: 0.86 },
				{ right: 650, top: 46, size: 34, opacity: 0.62 },
				{ right: 802, top: 96, size: 20, opacity: 0.42 },
				{ right: 426, top: 160, size: 92, opacity: 0.98 },
				{ right: 590, top: 194, size: 58, opacity: 0.78 },
				{ right: 744, top: 152, size: 32, opacity: 0.54 },
				{ right: 380, top: 286, size: 66, opacity: 1 },
				{ right: 530, top: 310, size: 80, opacity: 0.88 },
				{ right: 708, top: 268, size: 40, opacity: 0.62 },
				{ right: 852, top: 318, size: 22, opacity: 0.38 },
				{ right: 438, top: 428, size: 72, opacity: 0.96 },
				{ right: 596, top: 466, size: 48, opacity: 0.72 },
				{ right: 752, top: 418, size: 30, opacity: 0.5 },
				{ right: 392, top: 546, size: 84, opacity: 1 },
				{ right: 560, top: 562, size: 54, opacity: 0.78 },
				{ right: 720, top: 524, size: 34, opacity: 0.56 },
			].map((square, index) => (
				<div
					key={index.toLocaleString()}
					style={{
						position: "absolute",
						right: `${square.right}px`,
						top: `${square.top}px`,
						width: `${square.size}px`,
						height: `${square.size}px`,
						background: dissolveColor,
						opacity: square.opacity,
					}}
				/>
			))}
		</div>
	);

	if (variant === "game") {
		return new ImageResponse(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					position: "relative",
					overflow: "hidden",
					background: "#14151a",
					color: "#F4F0FF",
					fontFamily: "Inter, Manrope, Arial, sans-serif",
				}}
			>
				{imageSrc && (
					<img
						src={imageSrc}
						width="1200"
						height="630"
						alt=""
						style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
					/>
				)}
				<div
					style={{
						position: "absolute",
						inset: 0,
						background: "linear-gradient(180deg, rgba(12,13,18,0.18) 0%, rgba(12,13,18,0.24) 48%, rgba(12,13,18,0.86) 100%)",
					}}
				/>
				{coverSrc && (
					<div
						style={{
							position: "absolute",
							left: "20px",
							bottom: "20px",
							width: "170px",
							height: "238px",
							display: "flex",
							overflow: "hidden",
							border: "3px solid #2A2633",
							borderRadius: "8px",
							background: "#24212b",
							boxShadow: "0 18px 30px rgba(0,0,0,0.36)",
						}}
					>
						<img
							src={coverSrc}
							width="170"
							height="238"
							alt=""
							style={{ width: "100%", height: "100%", objectFit: "cover" }}
						/>
					</div>
				)}
				<div
					style={{
						position: "absolute",
						right: "20px",
						bottom: "20px",
						width: "78px",
						height: "78px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						borderRadius: "20px",
						background: "rgba(16,17,22,0.72)",
						boxShadow: "0 18px 30px rgba(0,0,0,0.35)",
						opacity: 0.5,
					}}
				>
					<img src={iconSrc} width="58" height="58" alt="" style={{ width: "58px", height: "58px", borderRadius: "14px" }} />
				</div>
				<div
					style={{
						position: "absolute",
						left: coverSrc ? "218px" : "82px",
						right: "126px",
						bottom: "20px",
						display: "flex",
						flexDirection: "column",
						alignItems: "flex-start",
						gap: "10px",
					}}
				>
					<div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "100%" }}>
						<div
							style={{
								color: "#D6A85C",
								alignSelf: "flex-start",
								fontSize: "25px",
								fontWeight: 800,
								textTransform: "uppercase",
								background: "rgba(16,17,22,0.6)",
								borderRadius: "12px",
								padding: "10px 14px",
							}}
						>
							{label}
						</div>
						<div
							style={{
								fontSize: titleSize,
								lineHeight: 1.02,
								fontWeight: 900,
								letterSpacing: "0",
								background: "rgba(16,17,22,0.6)",
								borderRadius: "12px",
								padding: "10px 14px",
							}}
						>
							{title}
						</div>
					</div>
				</div>
			</div>,
			size,
		);
	}

	if (variant === "profile") {
		return new ImageResponse(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					position: "relative",
					overflow: "hidden",
					background: "#14151a",
					color: "#F4F0FF",
					fontFamily: "Inter, Manrope, Arial, sans-serif",
				}}
			>
				{dissolveBackground}
				<div
					style={{
						position: "absolute",
						right: "86px",
						top: "116px",
						width: "330px",
						height: "330px",
						display: "flex",
						borderRadius: "4px",
						border: "10px solid #232633",
						background: "#14151a",
						overflow: "hidden",
					}}
				>
					{imageSrc ? (
						<img
							src={imageSrc}
							width="330"
							height="330"
							alt=""
							style={{ width: "100%", height: "100%", objectFit: "cover" }}
						/>
					) : (
						<div
							style={{
								width: "100%",
								height: "100%",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								color: "#9A7BFF",
								fontSize: "150px",
								fontWeight: 900,
							}}
						>
							{title.slice(0, 1)}
						</div>
					)}
				</div>
				<div
					style={{
						position: "relative",
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
						width: "100%",
						padding: "58px 82px 74px",
					}}
				>
					{brand}
					<div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "650px" }}>
						<div style={{ color: "#D6A85C", fontSize: "25px", fontWeight: 800, textTransform: "uppercase" }}>{label}</div>
						<div style={{ fontSize: titleSize, lineHeight: 1.03, fontWeight: 900, letterSpacing: "0" }}>{title}</div>
						<div style={{ fontSize: "27px", lineHeight: 1.3, color: "#D8D3E6", maxWidth: "610px" }}>{description}</div>
					</div>
				</div>
			</div>,
			size,
		);
	}

	if (variant === "library") {
		return new ImageResponse(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					position: "relative",
					overflow: "hidden",
					background: "#14151a",
					color: "#F4F0FF",
					fontFamily: "Inter, Manrope, Arial, sans-serif",
				}}
			>
				{imageSrc && (
					<img
						src={imageSrc}
						width="1200"
						height="630"
						alt=""
						style={{
							position: "absolute",
							inset: 0,
							width: "100%",
							height: "100%",
							objectFit: "cover",
							opacity: 0.18,
						}}
					/>
				)}
				<div
					style={{
						position: "absolute",
						right: "74px",
						top: "96px",
						width: "486px",
						height: "248px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						borderRadius: "4px",
					}}
				>
					<div style={{ position: "relative", width: "210px", height: "168px", display: "flex" }}>
						<div
							style={{
								position: "absolute",
								left: 0,
								top: 0,
								width: "98px",
								height: "168px",
								display: "flex",
								border: "8px solid #D6A85C",
								borderRight: "4px solid #D6A85C",
								borderRadius: "8px 0 0 8px",
								background: "#232633",
							}}
						/>
						<div
							style={{
								position: "absolute",
								right: 0,
								top: 0,
								width: "98px",
								height: "168px",
								display: "flex",
								border: "8px solid #9A7BFF",
								borderLeft: "4px solid #9A7BFF",
								borderRadius: "0 8px 8px 0",
								background: "#232633",
							}}
						/>
						<div
							style={{
								position: "absolute",
								left: "24px",
								top: "44px",
								width: "48px",
								height: "8px",
								borderRadius: "999px",
								background: "#F4F0FF",
								opacity: 0.68,
							}}
						/>
						<div
							style={{
								position: "absolute",
								left: "24px",
								top: "78px",
								width: "36px",
								height: "8px",
								borderRadius: "999px",
								background: "#F4F0FF",
								opacity: 0.48,
							}}
						/>
						<div
							style={{
								position: "absolute",
								right: "24px",
								top: "44px",
								width: "48px",
								height: "8px",
								borderRadius: "999px",
								background: "#F4F0FF",
								opacity: 0.68,
							}}
						/>
						<div
							style={{
								position: "absolute",
								right: "24px",
								top: "78px",
								width: "36px",
								height: "8px",
								borderRadius: "999px",
								background: "#F4F0FF",
								opacity: 0.48,
							}}
						/>
					</div>
				</div>
				{libraryGameCount != null && (
					<div
						style={{
							position: "absolute",
							right: "74px",
							bottom: "78px",
							display: "flex",
							flexDirection: "column",
							width: "486px",
							padding: "22px 26px",
							borderRadius: "8px",
							border: "2px solid #302A3B",
							background: "rgba(20,21,26,0.94)",
						}}
					>
						<div style={{ display: "flex", color: "#D6A85C", fontSize: "26px", fontWeight: 900 }}>Games</div>
						<div style={{ display: "flex", marginTop: "6px", color: "#D8D3E6", fontSize: "24px", lineHeight: 1.25 }}>
							{libraryGameCount}
						</div>
					</div>
				)}
				<div
					style={{
						position: "relative",
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
						width: "100%",
						padding: "58px 82px 74px",
					}}
				>
					{brand}
					<div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "700px" }}>
						<div style={{ color: "#D6A85C", fontSize: "25px", fontWeight: 800, textTransform: "uppercase" }}>{label}</div>
						<div style={{ fontSize: titleSize, lineHeight: 1.03, fontWeight: 900, letterSpacing: "0" }}>{title}</div>
						<div style={{ fontSize: "27px", lineHeight: 1.35, color: "#D8D3E6", maxWidth: "690px" }}>{description}</div>
					</div>
				</div>
			</div>,
			size,
		);
	}

	if (variant === "playlist") {
		return new ImageResponse(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					position: "relative",
					overflow: "hidden",
					background: "#14151a",
					color: "#F4F0FF",
					fontFamily: "Inter, Manrope, Arial, sans-serif",
				}}
			>
				<div
					style={{
						position: "absolute",
						inset: 0,
						background: "linear-gradient(110deg, rgba(20,21,26,1) 0%, rgba(20,21,26,0.94) 52%, rgba(154,123,255,0.28) 100%)",
					}}
				/>
				<div style={{ position: "absolute", right: "74px", top: "82px", display: "flex", width: "486px", height: "376px" }}>
					{[3, 2, 1, 0].map((index) => (
						<div
							key={index}
							style={{
								position: "absolute",
								left: `${index * 74}px`,
								top: `${index * 10}px`,
								width: "206px",
								height: "288px",
								display: "flex",
								overflow: "hidden",
								border: "4px solid #2A2633",
								borderRadius: "8px",
								background: "#24212b",
								boxShadow: "0 22px 36px rgba(0,0,0,0.35)",
							}}
						>
							{playlistImages[index] ? (
								<img
									src={playlistImages[index]}
									width="206"
									height="288"
									alt=""
									style={{ width: "100%", height: "100%", objectFit: "cover" }}
								/>
							) : (
								<div
									style={{
										width: "100%",
										height: "100%",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										background: "#24212b",
										color: "#9A7BFF",
										fontSize: "54px",
										fontWeight: 900,
									}}
								>
									{index + 1}
								</div>
							)}
						</div>
					))}
				</div>
				<div
					style={{
						position: "absolute",
						right: "74px",
						bottom: "78px",
						display: "flex",
						flexDirection: "column",
						width: "486px",
						padding: "22px 26px",
						borderRadius: "8px",
						border: "2px solid #302A3B",
						background: "rgba(20,21,26,0.94)",
					}}
				>
					<div style={{ display: "flex", color: "#D6A85C", fontSize: "26px", fontWeight: 900 }}>{label}</div>
					<div style={{ display: "flex", marginTop: "6px", color: "#D8D3E6", fontSize: "24px", lineHeight: 1.25 }}>
						{playlistGameCount === null ? "Curated game list" : `${playlistGameCount} game(s)`}
					</div>
				</div>
				<div
					style={{
						position: "relative",
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
						width: "100%",
						padding: "58px 82px 74px",
					}}
				>
					{brand}
					<div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "610px" }}>
						<div style={{ color: "#D6A85C", fontSize: "25px", fontWeight: 800, textTransform: "uppercase" }}>{label}</div>
						<div style={{ fontSize: titleSize, lineHeight: 1.03, fontWeight: 900, letterSpacing: "0" }}>{title}</div>
						<div style={{ fontSize: "27px", lineHeight: 1.35, color: "#D8D3E6", maxWidth: "600px" }}>{description}</div>
					</div>
				</div>
			</div>,
			size,
		);
	}

	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				background: "#14151a",
				color: "#F4F0FF",
				fontFamily: "Inter, Manrope, Arial, sans-serif",
				position: "relative",
				overflow: "hidden",
			}}
		>
			<div style={{ display: "flex", opacity: 0.2 }}>{dissolveBackground}</div>
			<div
				style={{
					position: "relative",
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					gap: "42px",
					width: "100%",
					padding: "76px 96px",
				}}
			>
				{brand}
				<div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "840px", paddingLeft: "90px" }}>
					<div style={{ fontSize: titleSize, lineHeight: 1.03, fontWeight: 800, letterSpacing: "0", color: "#F4F0FF" }}>
						{title}
					</div>
					<div style={{ fontSize: "27px", lineHeight: 1.38, color: "#D8D3E6", maxWidth: "760px" }}>{description}</div>
				</div>
			</div>
		</div>,
		size,
	);
}
