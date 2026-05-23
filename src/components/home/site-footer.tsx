"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { appConfig } from "../../../app.config";

export function SiteFooter() {
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		setMounted(true);
	}, []);

	return (
		<footer className="border-border/50 border-t py-12">
			<div className="mx-auto max-w-6xl px-4">
				<div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
					<div>
						<Link
							href="/"
							className="py-1.5 font-extrabold text-lg tracking-tight"
						>
							lumni
						</Link>
						<p className="mt-2 max-w-xs text-muted-foreground text-sm">
							AI-powered Matric exam preparation for South African students.
						</p>
					</div>
					<div>
						<h4 className="mb-3 font-semibold text-sm">Product</h4>
						<div className="flex flex-col text-muted-foreground text-sm">
							<Link
								href="/quiz"
								className="py-1.5 transition-colors hover:text-foreground"
							>
								Practice Quizzes
							</Link>
							<Link
								href="/past-papers"
								className="py-1.5 transition-colors hover:text-foreground"
							>
								Past Papers
							</Link>
							<Link
								href="/flashcards"
								className="py-1.5 transition-colors hover:text-foreground"
							>
								Flashcards
							</Link>
							<Link
								href="/study-plan"
								className="py-1.5 transition-colors hover:text-foreground"
							>
								Study Plan
							</Link>
							<Link
								href="/solve"
								className="py-1.5 transition-colors hover:text-foreground"
							>
								Homework Help
							</Link>
						</div>
					</div>
					<div>
						<h4 className="mb-3 font-semibold text-sm">Support</h4>
						<div className="flex flex-col text-muted-foreground text-sm">
							<a
								href={appConfig.links.support}
								className="py-1.5 transition-colors hover:text-foreground"
							>
								Help Center
							</a>
							<a
								href={`mailto:${appConfig.contact.supportEmail}`}
								className="py-1.5 transition-colors hover:text-foreground"
							>
								Email Us
							</a>
							<Link
								href={appConfig.links.privacy}
								className="py-1.5 transition-colors hover:text-foreground"
							>
								Privacy Policy
							</Link>
							<Link
								href={appConfig.links.terms}
								className="py-1.5 transition-colors hover:text-foreground"
							>
								Terms of Service
							</Link>
						</div>
					</div>
				</div>
				<div className="mt-8 flex flex-col items-center justify-between gap-4 border-border/50 border-t pt-8 sm:flex-row">
					<p className="text-muted-foreground text-xs">
						&copy; {mounted ? new Date().getFullYear() : ""} Lumni. All rights
						reserved.
					</p>
					<div className="flex items-center gap-4">
						<a
							href={`mailto:${appConfig.contact.email}`}
							className="py-1.5 text-muted-foreground transition-colors hover:text-foreground"
						>
							<span className="text-xs">Contact</span>
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}
