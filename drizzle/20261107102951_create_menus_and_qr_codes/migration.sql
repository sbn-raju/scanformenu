CREATE TYPE "dietary_type" AS ENUM('veg', 'non_veg', 'vegan', 'egg');--> statement-breakpoint
CREATE TABLE "menu_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"menu_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "menu_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"subcategory_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(12,2) NOT NULL,
	"dietary" "dietary_type",
	"image_id" uuid,
	"is_available" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "menu_items_price_non_negative" CHECK ("price" >= 0)
);
--> statement-breakpoint
ALTER TABLE "menu_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "menu_subcategories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "menu_subcategories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "menus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"property_id" uuid NOT NULL,
	"created_by" uuid,
	"slug" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "menus" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "qr_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"property_id" uuid NOT NULL,
	"menu_id" uuid NOT NULL,
	"created_by" uuid,
	"code" text NOT NULL UNIQUE,
	"label" text NOT NULL,
	"target_url" text NOT NULL,
	"color" text DEFAULT '#000000' NOT NULL,
	"svg" text NOT NULL,
	"scan_count" integer DEFAULT 0 NOT NULL,
	"last_scanned_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "qr_codes_scan_count_non_negative" CHECK ("scan_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "qr_codes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "menu_categories_menu_id_position_idx" ON "menu_categories" ("menu_id","position");--> statement-breakpoint
CREATE INDEX "menu_items_subcategory_id_position_idx" ON "menu_items" ("subcategory_id","position");--> statement-breakpoint
CREATE INDEX "menu_items_image_id_idx" ON "menu_items" ("image_id");--> statement-breakpoint
CREATE INDEX "menu_subcategories_category_id_position_idx" ON "menu_subcategories" ("category_id","position");--> statement-breakpoint
CREATE INDEX "menus_property_id_created_at_idx" ON "menus" ("property_id","created_at");--> statement-breakpoint
CREATE INDEX "menus_created_by_idx" ON "menus" ("created_by");--> statement-breakpoint
CREATE INDEX "qr_codes_property_id_created_at_idx" ON "qr_codes" ("property_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "qr_codes_menu_id_idx" ON "qr_codes" ("menu_id");--> statement-breakpoint
CREATE INDEX "qr_codes_created_by_idx" ON "qr_codes" ("created_by");--> statement-breakpoint
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_menu_id_menus_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_subcategory_id_menu_subcategories_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "menu_subcategories"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_image_id_media_assets_id_fkey" FOREIGN KEY ("image_id") REFERENCES "media_assets"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "menu_subcategories" ADD CONSTRAINT "menu_subcategories_category_id_menu_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "menu_categories"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "menus" ADD CONSTRAINT "menus_property_id_properties_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "menus" ADD CONSTRAINT "menus_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_property_id_properties_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_menu_id_menus_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;