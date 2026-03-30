CREATE TABLE `client_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`authorId` int NOT NULL,
	`content` text NOT NULL,
	`category` enum('general','clinical','follow_up','phone_call','lab_review','other') NOT NULL DEFAULT 'general',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`assignedBy` int NOT NULL,
	`title` varchar(512) NOT NULL,
	`description` text,
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`dueDate` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_tasks_id` PRIMARY KEY(`id`)
);
