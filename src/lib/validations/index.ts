import { z } from "zod";

/**
 * Shared validation schemas. Every form in the application validates against
 * these schemas using React Hook Form + @hookform/resolvers, and server
 * actions re-validate the payloads with the same schemas.
 */

const phoneRegex = /^[0-9+\-\s()]{7,15}$/;
export const indianPhone = z
  .string()
  .trim()
  .regex(phoneRegex, "Enter a valid phone number");

export const email = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .toLowerCase();

export const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long");

/** Public website contact / account registration. */
export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  companyName: z.string().trim().optional(),
  email,
  phone: indianPhone.optional().or(z.literal("")),
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email,
});

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const otpSchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{4,6}$/, "OTP must be 4–6 digits"),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
});

/** Get-a-quote lead form. */
export const quoteFormSchema = z.object({
  businessName: z.string().trim().min(2, "Business name is required"),
  contactName: z.string().trim().min(2, "Contact person is required"),
  phone: indianPhone,
  email: email.optional().or(z.literal("")),
  service: z.string().optional(),
  pickupAddress: z.string().trim().min(5, "Pickup address is required"),
  deliveryAddress: z.string().trim().min(5, "Delivery address is required"),
  pickupDate: z.string().optional(),
  packageType: z.string().optional(),
  weight: z.string().optional(),
  number_of_packages: z.string().optional(),
  specialInstructions: z.string().max(1000).optional(),
  preferredVehicle: z.string().optional(),
  urgency: z.string().optional(),
});

/** Customer management. */
export const customerSchema = z.object({
  companyName: z.string().trim().min(2, "Company name is required"),
  contactPerson: z.string().trim().min(2, "Contact person is required"),
  phone: indianPhone.optional().or(z.literal("")),
  email: email.optional().or(z.literal("")),
  gstNumber: z.string().trim().optional().or(z.literal("")),
  billingAddress: z.string().trim().optional(),
  notes: z.string().max(2000).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

/** Driver management. */
export const driverSchema = z.object({
  fullName: z.string().trim().min(2, "Name is required"),
  phone: indianPhone.optional().or(z.literal("")),
  email: email.optional().or(z.literal("")),
  licenseNumber: z.string().trim().optional(),
  licenseExpiry: z.string().optional(),
  address: z.string().trim().optional(),
  emergencyContact: z.string().trim().optional(),
  emergencyContactPhone: indianPhone.optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
});

export const newDriverAccountSchema = driverSchema.extend({
  newUserEmail: email,
  password,
});

/** Vehicle management. */
export const vehicleSchema = z.object({
  vehicleNumber: z
    .string()
    .trim()
    .min(3, "Vehicle number is required")
    .toUpperCase(),
  vehicleType: z.enum(["BIKE", "AUTO", "MINI_TRUCK", "LCV", "TRUCK", "OTHER"]),
  make: z.string().trim().optional(),
  model: z.string().trim().optional(),
  capacityKg: z.coerce.number().min(0).optional(),
  driverId: z.string().uuid("Select a driver").nullable().optional(),
  ownership: z.enum(["OWNED", "PARTNER"]),
  insuranceExpiry: z.string().optional(),
  permitExpiry: z.string().optional(),
  fitnessExpiry: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

/** Customer reusable address. */
export const addressSchema = z.object({
  label: z.string().trim().min(2, "Label is required"),
  contactName: z.string().trim().min(2, "Contact name is required"),
  phone: indianPhone.optional().or(z.literal("")),
  addressLine1: z.string().trim().min(5, "Address line 1 is required"),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(2, "State is required"),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5,6}$/, "Enter a valid PIN code")
    .optional()
    .or(z.literal("")),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
});

/** Create order (customer flow). */
export const createOrderSchema = z.object({
  pickupAddressId: z.string().uuid("Select a pickup address"),
  deliveryAddressId: z.string().uuid("Select a delivery address"),
  packageType: z.string().trim().min(2, "Package type is required"),
  weightKg: z.coerce.number().min(0).max(20000).optional(),
  numberOfPackages: z.coerce.number().int().min(1).max(500).default(1),
  distanceKm: z.coerce.number().min(0).max(2000).default(5),
  scheduledPickupAt: z.string().optional(),
  specialInstructions: z.string().max(1000).optional(),
});

/** Pricing rule configuration. */
export const pricingRuleSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  vehicleType: z.enum(["BIKE", "AUTO", "MINI_TRUCK", "LCV", "TRUCK", "OTHER"]),
  baseFare: z.coerce.number().min(0, "Base fare cannot be negative"),
  perKmRate: z.coerce.number().min(0),
  perKgRate: z.coerce.number().min(0),
  waitingCharge: z.coerce.number().min(0).default(0),
  extraStopCharge: z.coerce.number().min(0).default(0),
  minimumFare: z.coerce.number().min(0).default(0),
  active: z.boolean().default(true),
});

/** Payment recording. */
export const paymentSchema = z.object({
  orderId: z.string().uuid("Select an order"),
  customerId: z.string().uuid(),
  amount: z.coerce.number().positive("Amount must be positive"),
  method: z.enum(["CASH", "UPI", "BANK_TRANSFER", "CARD", "OTHER"]),
  status: z.enum(["PENDING", "PAID", "PARTIAL", "FAILED", "REFUNDED"]),
  transactionReference: z.string().trim().optional(),
  paidAt: z.string().optional(),
  notes: z.string().max(500).optional(),
});

/** Invoice creation. */
export const invoiceSchema = z.object({
  orderId: z.string().uuid("Select an order"),
  customerId: z.string().uuid(),
  subtotal: z.coerce.number().min(0),
  tax: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
});

/** Lead management. */
export const leadStatusSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "QUOTED", "CONVERTED", "LOST"]),
});

/** Driver accepts / starts a delivery. */
export const noteSchema = z.object({
  notes: z.string().trim().max(1000).optional(),
  lat: z.coerce.number().min(-90).max(90).optional().nullable(),
  lng: z.coerce.number().min(-180).max(180).optional().nullable(),
});

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email,
  phone: indianPhone.optional().or(z.literal("")),
  message: z.string().trim().min(10, "Message must be at least 10 characters"),
});