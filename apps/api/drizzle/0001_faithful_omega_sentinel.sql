CREATE TYPE "public"."language" AS ENUM('cs', 'en');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "language" "language" DEFAULT 'cs' NOT NULL;