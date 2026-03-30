CREATE TABLE `staff_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(64) NOT NULL,
	`createdByUserId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`email` varchar(320) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`usedByUserId` int,
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staff_invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `staff_invites_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','staff') NOT NULL DEFAULT 'user';