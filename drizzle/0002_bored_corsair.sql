CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`uploadedBy` int NOT NULL,
	`fileName` varchar(512) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`fileSize` int NOT NULL,
	`fileKey` text NOT NULL,
	`url` text NOT NULL,
	`category` enum('lab_results','treatment_plan','intake_form','consent','imaging','prescription','notes','other') NOT NULL DEFAULT 'other',
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `patients` MODIFY COLUMN `status` enum('active','paused','completed','new','inactive') NOT NULL DEFAULT 'new';