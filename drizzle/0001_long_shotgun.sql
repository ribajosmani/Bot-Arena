CREATE TABLE `agent_evolution` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`skillImprovement` json NOT NULL,
	`strategiesLearned` json NOT NULL,
	`winStreak` int NOT NULL DEFAULT 0,
	`lossStreak` int NOT NULL DEFAULT 0,
	`evolutionScore` decimal(10,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_evolution_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` enum('Hacker','Defender','Analyst') NOT NULL,
	`avatar` varchar(255) NOT NULL,
	`personality` json NOT NULL,
	`skills` json NOT NULL,
	`balance` decimal(18,2) NOT NULL DEFAULT '1000',
	`reputation` decimal(10,2) NOT NULL DEFAULT '0',
	`status` enum('idle','attacking','defending','offline') NOT NULL DEFAULT 'idle',
	`memory` json NOT NULL,
	`winCount` int NOT NULL DEFAULT 0,
	`lossCount` int NOT NULL DEFAULT 0,
	`totalBattles` int NOT NULL DEFAULT 0,
	`lastBattleAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`),
	CONSTRAINT `agents_agentId_unique` UNIQUE(`agentId`)
);
--> statement-breakpoint
CREATE TABLE `battles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`battleId` varchar(64) NOT NULL,
	`attackerId` int NOT NULL,
	`defenderId` int NOT NULL,
	`attackerName` varchar(255) NOT NULL,
	`defenderName` varchar(255) NOT NULL,
	`attackType` varchar(64) NOT NULL,
	`successProbability` decimal(5,2) NOT NULL,
	`wasSuccessful` int NOT NULL,
	`pointsStolen` decimal(18,2) NOT NULL DEFAULT '0',
	`reputationChange` decimal(10,2) NOT NULL,
	`battleLog` text,
	`attackerSkillsUsed` json,
	`defenderSkillsUsed` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `battles_id` PRIMARY KEY(`id`),
	CONSTRAINT `battles_battleId_unique` UNIQUE(`battleId`)
);
--> statement-breakpoint
CREATE INDEX `evolution_agentId_idx` ON `agent_evolution` (`agentId`);--> statement-breakpoint
CREATE INDEX `agentId_idx` ON `agents` (`agentId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `agents` (`status`);--> statement-breakpoint
CREATE INDEX `attacker_idx` ON `battles` (`attackerId`);--> statement-breakpoint
CREATE INDEX `defender_idx` ON `battles` (`defenderId`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `battles` (`createdAt`);