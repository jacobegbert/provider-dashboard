CREATE TABLE `patient_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(64) NOT NULL,
	`patientId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`usedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `patient_invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `patient_invites_token_unique` UNIQUE(`token`)
);
