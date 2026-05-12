import { LogoutIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListCell, ListGroup, ListSection } from "@/components/ui/list-cell";

interface ProfileTabProps {
	user: {
		name?: string;
		email?: string;
		phone?: string;
		$id?: string;
		[key: string]: unknown;
	} | null;
	onSignOut: () => void;
}

export function ProfileTab({ user, onSignOut }: ProfileTabProps) {
	return (
		<div className="space-y-[--space-4]">
			<ListSection header="Account">
				<ListGroup>
					<div className="ios-separator">
						<div className="flex items-center gap-[--space-4] px-[--space-4] py-[--space-4]">
							<Avatar className="size-12">
								<AvatarFallback className="text-sm font-semibold">
									{user?.name?.charAt(0) || "U"}
								</AvatarFallback>
							</Avatar>
							<div>
								<p className="ios-body font-semibold text-[--system-text-primary]">
									{user?.name || "User"}
								</p>
								<p className="ios-footnote text-[--system-text-secondary]">
									{user?.email}
								</p>
							</div>
						</div>
					</div>
					<div className="px-[--space-4] py-[--space-3] space-y-1">
						<Label className="ios-body font-medium text-[--system-text-primary]">
							Display Name
						</Label>
						<Input
							id="name"
							defaultValue={user?.name || ""}
							placeholder="Your name"
						/>
					</div>
					<div className="px-[--space-4] py-[--space-3] space-y-1">
						<Label className="ios-body font-medium text-[--system-text-primary]">
							Email
						</Label>
						<Input
							id="email"
							type="email"
							defaultValue={user?.email || ""}
							disabled
							className="bg-muted/50"
						/>
						<p className="ios-footnote text-[--system-text-tertiary]">
							Email cannot be changed
						</p>
					</div>
				</ListGroup>
			</ListSection>

			<div className="px-[--space-4]">
				<Button variant="destructive" onClick={onSignOut} className="w-full">
					<HugeiconsIcon icon={LogoutIcon} className="mr-2 size-4" />
					Sign Out
				</Button>
			</div>
		</div>
	);
}
