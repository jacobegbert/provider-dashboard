CREATE TABLE `assignment_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assignmentId` int NOT NULL,
	`sourceStepId` int,
	`sortOrder` int NOT NULL DEFAULT 0,
	`title` varchar(512) NOT NULL,
	`description` text,
	`frequency` enum('daily','weekly','biweekly','monthly','once','as_needed','custom') NOT NULL DEFAULT 'daily',
	`customDays` json,
	`startDay` int NOT NULL DEFAULT 1,
	`endDay` int,
	`timeOfDay` enum('morning','afternoon','evening','any') NOT NULL DEFAULT 'any',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assignment_steps_id` PRIMARY KEY(`id`)
);
