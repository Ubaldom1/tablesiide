CREATE TABLE `interests` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`restaurant` text NOT NULL,
	`city` text NOT NULL,
	`quantity` integer,
	`price_usd` integer,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `interests_email_unique` ON `interests` (`email`);
