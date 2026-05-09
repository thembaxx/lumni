import { LogoutIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

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
		<Card className="border-border/50 shadow-sm">
			<CardHeader className="pb-4">
				<CardTitle className="text-lg">Profile</CardTitle>
				<CardDescription>Manage your account information</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="flex items-center gap-4">
					<Avatar className="size-16">
						<AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
					</Avatar>
					<div>
						<p className="font-medium">{user?.name}</p>
						<p className="text-sm text-muted-foreground">{user?.email}</p>
					</div>
				</div>

				<Separator />

				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Display Name</Label>
						<Input
							id="name"
							defaultValue={user?.name || ""}
							placeholder="Your name"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							defaultValue={user?.email || ""}
							disabled
							className="bg-muted/50"
						/>
						<p className="text-xs text-muted-foreground">
							Email cannot be changed
						</p>
					</div>
				</div>

				<Separator />

				<Button variant="destructive" onClick={onSignOut} className="w-full">
					<HugeiconsIcon icon={LogoutIcon} className="mr-2 size-4" />
					Sign Out
				</Button>
			</CardContent>
		</Card>
	);
}
