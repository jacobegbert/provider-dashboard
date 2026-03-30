CREATE TABLE `provider_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`firstName` varchar(128),
	`lastName` varchar(128),
	`email` varchar(320),
	`phone` varchar(32),
	`practiceName` varchar(256),
	`title` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `provider_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `provider_profiles_userId_unique` UNIQUE(`userId`)
);
