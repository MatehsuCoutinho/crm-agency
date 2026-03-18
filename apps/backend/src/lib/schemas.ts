import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters")
});

export const createUserSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["ADMIN", "ATTENDANT"], { message: "Invalid role" })
});

export const createClientSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    phone: z.string().optional()
});

export const updateClientSchema = createClientSchema.partial();