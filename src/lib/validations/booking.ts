import { z } from "zod";

export const patientFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address"),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+()\- ]{8,20}$/, "Please enter a valid phone number (8-20 digits)"),
  age: z
    .number()
    .int("Age must be a whole number")
    .min(1, "Age must be greater than 0")
    .max(130, "Please enter a realistic age"),
  reason: z
    .string()
    .trim()
    .max(1000, "Reason must not exceed 1000 characters")
    .optional()
    .or(z.literal("")),
  language: z
    .string()
    .trim()
    .max(50)
    .default("English"),
});

export const createBookingHoldSchema = patientFormSchema.extend({
  appointmentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Appointment date must be in YYYY-MM-DD format"),
  slotTime: z.enum(["19:00", "19:20", "19:40"]),
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;
export type CreateBookingHoldValues = z.infer<typeof createBookingHoldSchema>;
