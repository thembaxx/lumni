"use client";

import { MinusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type * as React from "react";

export function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="input-otp-separator"
			className="flex items-center [&_svg:not([class*='size-'])]:size-4"
			aria-hidden="true"
			{...props}
		>
			<HugeiconsIcon icon={MinusSignIcon} className="size-4" />
		</div>
	);
}
