/**
 * SK Ways Logistics — development seed script.
 *
 * Run with: node supabase/seed.mjs
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in the
 * environment (or in a .env.local file at the repo root).
 *
 * Seeded login credentials (all users): email below / Password@123
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// --- load .env.local, if present -------------------------------------------
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(root, ".env.local");

function loadEnv() {
  if (!existsSync(envFile)) return;
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["|]|["|]$/g, "");
  }
}
loadEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const ADMIN_PASSWORD = "Password@123";
const supabase = createClient(URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureUser(email, role, fullName, phone, companyName) {
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users?.find((u) => u.email === email);
  if (found) {
    console.log(`user exists: ${email}`);
    return found;
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { role, full_name: fullName, phone: phone ?? "", company_name: companyName ?? "" },
  });
  if (error) throw new Error(`createUser ${email}: ${error.message}`);
  console.log(`created user: ${email} (${role})`);
  return data.user;
}

const get = async (table, column, value) => {
  const { data, error } = await supabase.from(table).select("*").eq(column, value).maybeSingle();
  if (error) throw error;
  return data;
};

async function seedPricingRules() {
  const rules = [
    { name: "Bike Delivery", vehicle_type: "BIKE", base_fare: 50, per_km_rate: 12, per_kg_rate: 5, minimum_fare: 60 },
    { name: "Auto Delivery", vehicle_type: "AUTO", base_fare: 80, per_km_rate: 15, per_kg_rate: 8, minimum_fare: 100 },
    { name: "Mini Truck", vehicle_type: "MINI_TRUCK", base_fare: 300, per_km_rate: 25, per_kg_rate: 4, minimum_fare: 350 },
    { name: "LCV", vehicle_type: "LCV", base_fare: 600, per_km_rate: 35, per_kg_rate: 3, minimum_fare: 700 },
    { name: "Truck", vehicle_type: "TRUCK", base_fare: 1200, per_km_rate: 50, per_kg_rate: 2, minimum_fare: 1500 },
  ];
  const { data, error } = await supabase.from("pricing_rules").insert(rules).select();
  if (error) throw new Error(`pricing rules: ${error.message}`);
  console.log(`seeded ${data?.length ?? rules.length} pricing rules`);
}

async function main() {
  console.log("Seeding SK Ways Logistics dev database...");

  const existingRules = await supabase.from("pricing_rules").select("id").limit(1);
  if (!existingRules.data?.length) await seedPricingRules();

  // ---- Admin
  await ensureUser("admin@skways.in", "ADMIN", "SK Ways Admin", "+91 98450 00000");

  // ---- Drivers
  const driverDefs = [
    { email: "driver1@skways.in", name: "Ramesh Kumar", phone: "+91 90000 10001", license: "KA-01-2021-4481" },
    { email: "driver2@skways.in", name: "Suresh Naidu", phone: "+91 90000 10002", license: "KA-02-2020-3321" },
    { email: "driver3@skways.in", name: "Mahesh Reddy", phone: "+91 90000 10003", license: "KA-03-2022-7789" },
    { email: "driver4@skways.in", name: "Ganesh Patil", phone: "+91 90000 10004", license: "KA-04-2019-9982" },
    { email: "driver5@skways.in", name: "Praveen Kumar", phone: "+91 90000 10005", license: "KA-05-2023-1104" },
  ];

  const driverRows = [];
  for (const [i, d] of driverDefs.entries()) {
    const user = await ensureUser(d.email, "DRIVER", d.name, d.phone);
    const profile = await get("profiles", "user_id", user.id);
    if (!profile) throw new Error(`profile missing for ${d.email}`);
    const existing = await supabase.from("drivers").select("id").eq("profile_id", profile.id).maybeSingle();
    let driver;
    if (!existing.data) {
      const { data, error } = await supabase.from("drivers").insert({
        profile_id: profile.id,
        license_number: d.license,
        license_expiry: "2028-03-31",
        address: "Peenya Industrial Area, Bengaluru",
        emergency_contact: "Family",
        emergency_contact_phone: "+91 90000 11111",
      }).select().single();
      if (error) throw error;
      driver = data;
    } else {
      await supabase.from("drivers").update({ license_number: d.license }).eq("id", existing.data.id);
      driver = { id: existing.data.id };
    }
    driverRows.push(driver.id);
  }
  console.log(`seeded ${driverRows.length} drivers`);

  // ---- Vehicles
  const vehicleDefs = [
    { number: "KA-05-AB-1234", type: "BIKE", make: "Honda", model: "Activa 6G", cap: 40, ownership: "OWNED" },
    { number: "KA-01-MN-2211", type: "AUTO", make: "Bajaj", model: "RE", cap: 250, ownership: "OWNED" },
    { number: "KA-03-XY-8890", type: "MINI_TRUCK", make: "Tata", model: "Ace", cap: 700, ownership: "OWNED" },
    { number: "KA-02-PQ-4433", type: "LCV", make: "Mahindra", model: "Bolero", cap: 1500, ownership: "PARTNER" },
    { number: "KA-04-CD-7766", type: "TRUCK", make: "BharatBenz", model: "1017R", cap: 5000, ownership: "PARTNER" },
  ];
  for (const [i, v] of vehicleDefs.entries()) {
    const { data: existing } = await supabase.from("vehicles").select("id").eq("vehicle_number", v.number).maybeSingle();
    if (existing) continue;
    const { error } = await supabase.from("vehicles").insert({
      vehicle_number: v.number, vehicle_type: v.type, make: v.make, model: v.model,
      capacity_kg: v.cap, ownership: v.ownership, driver_id: driverRows[i],
    });
    if (error) throw error;
  }
  console.log("seeded 5 vehicles");

  console.log("\nDone seeding. Default password for all users: Password@123");
  console.log("Admin: admin@skways.in");
  for (const d of driverDefs) console.log(`Driver: ${d.email}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});