import { LogoutIcon, Mail01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ListCell, ListSection } from "@/components/ui/list-cell";

interface ProfileTabProps {
	user: {
		userId: string | null;
		name: string | null;
		email: string | null;
	} | null;
	onSignOut: () => void;
}

export function ProfileTab({ user, onSignOut }: ProfileTabProps) {
	return (
		<div className="space-y-10">
			<div className="flex flex-col items-center justify-center py-8 space-y-4">
				<div className="relative group">
					<Avatar className="size-24 shadow-level-3 border-[6px] border-system-surface transition-transform duration-500 group-hover:scale-105">
						<AvatarFallback className="text-3xl font-bold bg-system-accent text-white">
							{user?.name?.charAt(0) || "U"}
						</AvatarFallback>
					</Avatar>
					<div className="absolute inset-0 rounded-full ring-1 ring-black/10 dark:ring-white/10 pointer-events-none" />
					<div className="absolute -bottom-1 -right-1 size-8 rounded-full bg-system-surface shadow-level-2 border border-border/10 flex items-center justify-center text-system-accent">
						<HugeiconsIcon icon={UserIcon} className="size-4" />
					</div>
				</div>
				<div className="text-center space-y-1">
					<h2 className="text-(length:--fs-title-2) font-bold text-foreground">
						{user?.name || "User"}
					</h2>
					<p className="text-(length:--fs-subhead) font-medium text-[--system-text-secondary]">
						{user?.email}
					</p>
				</div>
			</div>

			<ListSection header="Personal Information">
				<ListCell
					leading={<HugeiconsIcon icon={UserIcon} className="size-5" />}
					title="Display Name"
					subtitle={user?.name || "Not set"}
					trailing={
						<span className="text-system-accent text-(length:--fs-footnote) font-semibold">
							Edit
						</span>
					}
				/>
				<ListCell
					leading={<HugeiconsIcon icon={Mail01Icon} className="size-5" />}
					title="Email Address"
					subtitle={user?.email || "Not set"}
					showSeparator={false}
				/>
			</ListSection>

			<div className="px-2 pt-4">
				<Button
					size="sm"
					variant="destructive"
					onClick={onSignOut}
					className="w-full h-11 rounded-lg font-medium text-sm shadow-level-2 transition-[transform,opacity] active:scale-[0.96]"
				>
					<HugeiconsIcon icon={LogoutIcon} className="mr-2 size-5" />
					Sign Out
				</Button>
				<div className="mt-8 flex flex-col items-center gap-1">
					<p className="text-(length:--fs-footnote) text-[--system-text-tertiary] font-bold tracking-widest uppercase">
						Lumni Mobile
					</p>
					<p className="text-(length:--fs-caption-2) text-[--system-text-tertiary] tabular-nums font-medium">
						Version 1.0.4 (Stable-RC)
					</p>
				</div>
			</div>
		</div>
	);
}
