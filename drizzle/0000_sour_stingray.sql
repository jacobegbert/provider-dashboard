CREATE TABLE `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`providerId` int NOT NULL,
	`createdBy` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`type` enum('initial','follow_up','check_in','lab_work','urgent') NOT NULL DEFAULT 'follow_up',
	`scheduledAt` timestamp NOT NULL,
	`durationMinutes` int NOT NULL DEFAULT 30,
	`location` varchar(512),
	`assistantNotes` text,
	`patientNotes` text,
	`status` enum('scheduled','completed','cancelled','no_show') NOT NULL DEFAULT 'scheduled',
	`googleEventId` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attention_dismissals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`itemKey` varchar(128) NOT NULL,
	`action` enum('dismissed','resolved') NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attention_dismissals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(128) NOT NULL,
	`entityType` varchar(64) NOT NULL,
	`entityId` int,
	`details` json,
	`ipAddress` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
--> statement-breakpoint
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
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`receiverId` int NOT NULL,
	`patientId` int NOT NULL,
	`content` text NOT NULL,
	`messageType` enum('text','system','alert') NOT NULL DEFAULT 'text',
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`body` text,
	`type` enum('message','task_overdue','task_reminder','appointment_reminder','compliance_alert','subscription_expiring','milestone_reached','system') NOT NULL DEFAULT 'system',
	`relatedEntityType` varchar(64),
	`relatedEntityId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`pushSent` boolean NOT NULL DEFAULT false,
	`emailSent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`providerId` int NOT NULL,
	`firstName` varchar(128) NOT NULL,
	`lastName` varchar(128) NOT NULL,
	`email` varchar(320),
	`phone` varchar(32),
	`dateOfBirth` varchar(16),
	`status` enum('active','paused','completed','new','inactive') NOT NULL DEFAULT 'new',
	`subscriptionTier` enum('standard','premium','elite') NOT NULL DEFAULT 'standard',
	`subscriptionExpiresAt` timestamp,
	`healthGoals` json,
	`conditions` json,
	`notes` text,
	`avatarUrl` text,
	`lastProviderInteraction` timestamp,
	`nextRequiredAction` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `protocol_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`protocolId` int NOT NULL,
	`assignedBy` int NOT NULL,
	`status` enum('active','paused','completed','cancelled') NOT NULL DEFAULT 'active',
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`compliancePercent` int NOT NULL DEFAULT 0,
	`providerNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `protocol_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `protocol_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`protocolId` int NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`title` varchar(512) NOT NULL,
	`description` text,
	`frequency` enum('daily','weekly','biweekly','monthly','once','as_needed','custom') NOT NULL DEFAULT 'daily',
	`customDays` json,
	`startDay` int NOT NULL DEFAULT 1,
	`endDay` int,
	`timeOfDay` enum('morning','afternoon','evening','any') NOT NULL DEFAULT 'any',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `protocol_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `protocols` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdBy` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`category` enum('nutrition','supplement','lifestyle','lab_work','exercise','sleep','stress','detox','hormone','gut_health','other') NOT NULL DEFAULT 'other',
	`durationDays` int,
	`isTemplate` boolean NOT NULL DEFAULT true,
	`milestones` json,
	`labCheckpoints` json,
	`isArchived` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `protocols_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subscription` json NOT NULL,
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `push_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `task_completions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assignmentId` int NOT NULL,
	`stepId` int NOT NULL,
	`patientId` int NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	`taskDate` varchar(10) NOT NULL,
	`notes` text,
	CONSTRAINT `task_completions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
