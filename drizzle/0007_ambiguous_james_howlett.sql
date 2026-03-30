CREATE TABLE `attention_dismissals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`itemKey` varchar(128) NOT NULL,
	`action` enum('dismissed','resolved') NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attention_dismissals_id` PRIMARY KEY(`id`)
);
