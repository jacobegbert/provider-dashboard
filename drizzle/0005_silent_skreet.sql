ALTER TABLE `assignment_steps` ADD `dosageAmount` varchar(64);--> statement-breakpoint
ALTER TABLE `assignment_steps` ADD `dosageUnit` varchar(32);--> statement-breakpoint
ALTER TABLE `assignment_steps` ADD `route` varchar(64);--> statement-breakpoint
ALTER TABLE `protocol_steps` ADD `dosageAmount` varchar(64);--> statement-breakpoint
ALTER TABLE `protocol_steps` ADD `dosageUnit` varchar(32);--> statement-breakpoint
ALTER TABLE `protocol_steps` ADD `route` varchar(64);