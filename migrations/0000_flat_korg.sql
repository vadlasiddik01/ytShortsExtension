CREATE TABLE "aggregate_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"total_installations" integer DEFAULT 0,
	"total_active" integer DEFAULT 0,
	"total_shorts_blocked" integer DEFAULT 0,
	"total_shorts_hidden" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "installations" (
	"id" serial PRIMARY KEY NOT NULL,
	"installation_id" varchar(100) NOT NULL,
	"first_installed" timestamp DEFAULT now() NOT NULL,
	"last_active" timestamp DEFAULT now() NOT NULL,
	"version" varchar(20) NOT NULL,
	"browser_info" text,
	CONSTRAINT "installations_installation_id_unique" UNIQUE("installation_id")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"installation_id" varchar(100) NOT NULL,
	"hide_shorts" boolean DEFAULT true,
	"block_shorts" boolean DEFAULT false,
	"use_statistics" boolean DEFAULT true,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "statistics" (
	"id" serial PRIMARY KEY NOT NULL,
	"installation_id" varchar(100) NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"shorts_blocked" integer DEFAULT 0,
	"shorts_hidden" integer DEFAULT 0,
	"last_reset" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_installation_id_installations_installation_id_fk" FOREIGN KEY ("installation_id") REFERENCES "public"."installations"("installation_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statistics" ADD CONSTRAINT "statistics_installation_id_installations_installation_id_fk" FOREIGN KEY ("installation_id") REFERENCES "public"."installations"("installation_id") ON DELETE cascade ON UPDATE no action;