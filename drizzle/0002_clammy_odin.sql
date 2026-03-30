CREATE TABLE `biomarker_custom_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`unit` varchar(32) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `biomarker_custom_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `biomarker_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`metricName` varchar(128) NOT NULL,
	`value` varchar(64) NOT NULL,
	`unit` varchar(32) NOT NULL,
	`measuredAt` varchar(10) NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `biomarker_entries_id` PRIMARY KEY(`id`)
);
