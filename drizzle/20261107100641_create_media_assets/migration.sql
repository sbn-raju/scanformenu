CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"property_id" uuid NOT NULL,
	"uploaded_by" uuid,
	"title" text NOT NULL,
	"description" text,
	"imagekit_file_id" text NOT NULL UNIQUE,
	"file_path" text NOT NULL,
	"url" text NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_assets_dimensions_non_negative" CHECK ("size_bytes" >= 0 and coalesce("width", 0) >= 0 and coalesce("height", 0) >= 0)
);
--> statement-breakpoint
ALTER TABLE "media_assets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "media_assets_property_id_uploaded_at_idx" ON "media_assets" ("property_id","uploaded_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "media_assets_uploaded_by_idx" ON "media_assets" ("uploaded_by");--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_property_id_properties_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_users_id_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL;