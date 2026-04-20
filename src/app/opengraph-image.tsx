import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Lumni - AI-Powered Study Companion";
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = "image/png";

export default function Image() {
	return new ImageResponse(
		<div
			style={{
				height: "100%",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: "#fff",
				padding: "40px",
			}}
		>
			<div
				style={{
					fontSize: 80,
					fontWeight: 400,
					letterSpacing: "-0.02em",
					color: "#000",
				}}
			>
				Lumni
			</div>
			<div
				style={{
					fontSize: 28,
					color: "#666",
					marginTop: 20,
					textAlign: "center",
				}}
			>
				Pass your Matric with confidence.
			</div>
			<div
				style={{
					fontSize: 24,
					color: "#888",
					marginTop: 10,
					textAlign: "center",
				}}
			>
				Your AI-powered study companion
			</div>
		</div>,
		{
			width: size.width,
			height: size.height,
		},
	);
}
