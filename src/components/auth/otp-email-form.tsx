"use client";

import { AlertCircleIcon, FlashIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingDots } from "./loading-dots";

interface OtpEmailFormProps {
	email: string;
	error: string;
	loading: boolean;
	onEmailChange: (email: string) => void;
	onSend: () => void;
}

export function OtpEmailForm({
	email,
	error,
	loading,
	onEmailChange,
	onSend,
}: OtpEmailFormProps) {
	return (
		<div className="flex flex-col gap-2">
			<Input
				type="email"
				placeholder="email@example.com"
				value={email}
				onChange={(e) => {
					onEmailChange(e.target.value);
				}}
				autoComplete="email"
				className="-webkit-font-smoothing h-11 rounded-md antialiased ring-1 ring-transparent transition-[ring-color,box-shadow] duration-150 focus-within:ring-[--system-accent]/30"
			/>
			{error && (
				<p className="flex items-center gap-1 text-destructive text-xs">
					<HugeiconsIcon icon={AlertCircleIcon} className="size-3" />
					{error}
				</p>
			)}
			<Button onClick={onSend} disabled={loading || !email} className="w-full">
				{loading ? (
					<span className="flex items-center gap-2">
						<LoadingDots />
						<span>PaperPlaneing…</span>
					</span>
				) : (
					<span className="flex items-center gap-2">
						<HugeiconsIcon icon={FlashIcon} className="size-4" />
						MailSend01Icon OTP
					</span>
				)}
			</Button>
		</div>
	);
}
