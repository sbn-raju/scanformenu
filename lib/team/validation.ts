import { z } from "zod";

import { MEMBER_ROLES } from "@/lib/properties/constants";

const role = z.enum(MEMBER_ROLES, { error: "Choose a role" });

export const addMemberSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .trim()
    .toLowerCase()
    .min(1, { error: "Email is required" })
    .pipe(z.email({ error: "Enter a valid email address" })),
  role,
});

export const changeMemberRoleSchema = z.object({
  userId: z.uuid({ error: "That member doesn't exist" }),
  role,
});
