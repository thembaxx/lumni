CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `question` (
	`id` text PRIMARY KEY NOT NULL,
	`topic_id` text NOT NULL,
	`type` text DEFAULT 'multiple_choice' NOT NULL,
	`question_text` text NOT NULL,
	`options` text,
	`correct_answer` text NOT NULL,
	`explanation` text,
	`difficulty` text DEFAULT 'medium',
	`has_image` integer DEFAULT false,
	`image_url` text,
	`image_data` text,
	`order_index` integer DEFAULT 0,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`topic_id`) REFERENCES `topic`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `study_session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`subject_id` text NOT NULL,
	`questions_answered` integer DEFAULT 0,
	`correct_count` integer DEFAULT 0,
	`duration` integer,
	`started_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`ended_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subject`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `study_session_userId_idx` ON `study_session` (`user_id`);--> statement-breakpoint
CREATE TABLE `subject` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`description` text,
	`icon` text,
	`category` text NOT NULL,
	`color` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `topic` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`unit_number` integer,
	`order_index` integer DEFAULT 0,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`subject_id`) REFERENCES `subject`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `user_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`subject_id` text NOT NULL,
	`questions_attempted` integer DEFAULT 0,
	`correct_count` integer DEFAULT 0,
	`current_streak` integer DEFAULT 0,
	`longest_streak` integer DEFAULT 0,
	`last_attempt_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subject`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_progress_userId_idx` ON `user_progress` (`user_id`);--> statement-breakpoint
CREATE TABLE `user_subject` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`subject_id` text NOT NULL,
	`selected_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subject`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_subject_userId_idx` ON `user_subject` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_subject_subjectId_idx` ON `user_subject` (`subject_id`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);