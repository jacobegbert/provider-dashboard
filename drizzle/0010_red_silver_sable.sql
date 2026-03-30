CREATE TABLE `intake_forms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`currentSection` int NOT NULL DEFAULT 0,
	`status` enum('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
	`formData` json,
	`completedSections` json,
	`submittedAt` timestamp,
	`providerNotes` text,
	`reviewedByProvider` boolean NOT NULL DEFAULT false,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `intake_forms_id` PRIMARY KEY(`id`)
);
