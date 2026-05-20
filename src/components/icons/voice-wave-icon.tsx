interface VoiceWaveIconProps {
	className?: string;
}

export function VoiceWaveIcon({ className }: VoiceWaveIconProps) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="currentColor"
			xmlns="http://www.w3.org/2000/svg"
		>
			<title>Voice wave</title>
			<rect x="4" y="8" width="2" height="8" rx="1" />
			<rect x="8" y="5" width="2" height="14" rx="1" />
			<rect x="12" y="3" width="2" height="18" rx="1" />
			<rect x="16" y="6" width="2" height="12" rx="1" />
			<rect x="20" y="9" width="2" height="6" rx="1" />
		</svg>
	);
}
