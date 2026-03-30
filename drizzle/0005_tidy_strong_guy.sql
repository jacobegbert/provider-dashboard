CREATE TABLE `google_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`expiresAt` bigint,
	`googleEmail` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `google_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `google_tokens_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `appointments` ADD `googleEventId` varchar(512);