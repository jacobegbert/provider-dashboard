CREATE TABLE `resource_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resourceId` int NOT NULL,
	`patientId` int NOT NULL,
	`sharedBy` int NOT NULL,
	`message` text,
	`isViewed` boolean NOT NULL DEFAULT false,
	`viewedAt` timestamp,
	`sharedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `resource_shares_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdBy` int NOT NULL,
	`title` varchar(512) NOT NULL,
	`description` text,
	`type` enum('file','link','article') NOT NULL DEFAULT 'file',
	`category` enum('nutrition','exercise','supplement','lifestyle','hormone','lab_education','recovery','mental_health','general') NOT NULL DEFAULT 'general',
	`fileKey` text,
	`fileUrl` text,
	`fileName` varchar(512),
	`mimeType` varchar(128),
	`fileSize` int,
	`externalUrl` text,
	`content` text,
	`tags` json,
	`isArchived` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resources_id` PRIMARY KEY(`id`)
);
