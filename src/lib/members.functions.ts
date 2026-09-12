import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const memberInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  dateOfBirth: z.string().trim().min(4).max(20),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "Enter a 10 digit phone number"),
  bloodGroup: z.string().trim().min(1).max(5),
  district: z.string().trim().min(1).max(80),
  taluk: z.string().trim().min(1).max(80),
  address: z.string().trim().min(3).max(500),
  emergencyContact: z.string().trim().max(20).optional().or(z.literal("")),
  designation: z.string().trim().min(1).max(80),
  aadharNumber: z
    .string()
    .trim()
    .regex(/^[0-9]{12}$/, "Aadhar number must be 12 digits"),
  photoDataUrl: z.string().trim().max(4_500_000).optional().or(z.literal("")),
  consent: z.literal(true),
  source: z.enum(["public", "admin"]).default("public"),
  adminToken: z.string().optional(),
});

export type MemberInput = z.infer<typeof memberInputSchema>;

export type MemberRecord = {
  id: string;
  membership_id: string;
  full_name: string;
  date_of_birth: string;
  phone: string;
  blood_group: string;
  district: string;
  taluk: string;
  address: string;
  emergency_contact: string | null;
  designation: string;
  aadhar_number: string | null;
  photo_url: string | null;
  source: string;
  payment_status: string;
  payment_amount: number;
  valid_from: string;
  valid_until: string;
  created_at: string;
};

const FREE_UNTIL = "2026-10-11";
const MEMBERSHIP_FEE = 100;

function newMembershipId() {
  return `AKAPBKS${Math.floor(100000 + Math.random() * 900000)}`;
}

export const registerMember = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => memberInputSchema.parse(data))
  .handler(async ({ data }): Promise<MemberRecord> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const withinFreeWindow = new Date() <= new Date(`${FREE_UNTIL}T23:59:59Z`);
    const validFrom = new Date();
    const validUntil = new Date(validFrom);
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    let lastError: string | null = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const { data: row, error } = await supabaseAdmin
        .from("members")
        .insert({
          membership_id: newMembershipId(),
          full_name: data.fullName,
          date_of_birth: data.dateOfBirth,
          phone: data.phone,
          blood_group: data.bloodGroup,
          district: data.district,
          taluk: data.taluk,
          address: data.address,
          emergency_contact: data.emergencyContact || null,
          designation: data.designation,
          aadhar_number: data.aadharNumber,
          photo_url: data.photoDataUrl || null,
          consent: true,
          source: data.source,
          payment_status: withinFreeWindow ? "free" : "pending",
          payment_amount: withinFreeWindow ? 0 : MEMBERSHIP_FEE,
          valid_from: validFrom.toISOString().slice(0, 10),
          valid_until: validUntil.toISOString().slice(0, 10),
        })
        .select("*")
        .single();

      if (!error && row) return row as MemberRecord;
      lastError = error?.message ?? "Registration failed";
      if (!error?.message?.includes("duplicate")) break;
    }
    throw new Error(lastError ?? "Registration failed");
  });

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: { username: string; password: string }) =>
    z.object({ username: z.string().min(1), password: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { verifyCredentials, issueAdminToken } = await import("./admin.server");
    if (!verifyCredentials(data.username, data.password)) {
      return { ok: false as const };
    }
    return { ok: true as const, token: issueAdminToken() };
  });

export const listMembers = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string }) => z.object({ token: z.string() }).parse(data))
  .handler(async ({ data }): Promise<MemberRecord[]> => {
    const { assertAdminToken } = await import("./admin.server");
    assertAdminToken(data.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("members")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as MemberRecord[];
  });

export const deleteMember = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string; id: string }) =>
    z.object({ token: z.string(), id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    const { assertAdminToken } = await import("./admin.server");
    assertAdminToken(data.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("members").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Used by the QR code target page: verification details only. */
export const verifyMembership = createServerFn({ method: "POST" })
  .inputValidator((data: { membershipId: string }) =>
    z.object({ membershipId: z.string().trim().min(4).max(30) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("members")
      .select(
        "membership_id, full_name, designation, district, taluk, blood_group, date_of_birth, phone, photo_url, valid_from, valid_until, payment_status, created_at",
      )
      .eq("membership_id", data.membershipId.toUpperCase())
      .maybeSingle();
    if (!row) return { found: false as const };
    return { found: true as const, member: row };
  });
