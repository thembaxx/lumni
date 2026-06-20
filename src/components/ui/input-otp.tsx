"use client";

import { OTPInput } from "input-otp";
import type * as React from "react";
import { cn } from "@/lib/utils";
import { InputOTPGroup } from "./input-otp-group";
import { InputOTPSlot } from "./input-otp-slot";

export { InputOTPGroup, InputOTPSlot };

function InputOTP({
	className,
	containerClassName,
	...props
}: React.ComponentProps<typeof OTPInput> & {
	containerClassName?: string;
}) {
	return (
		<OTPInput
			data-slot="input-otp"
			containerClassName={cn(
				"cn-input-otp flex items-center has-disabled:opacity-50",
				containerClassName,
			)}
			spellCheck={false}
			className={cn("disabled:cursor-not-allowed", className)}
			{...props}
		/>
	);
}

export { InputOTP };
