import { z } from "zod";

export const registerAdminSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(5, "Password must be at least 5 characters")
});

export const loginSchema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(5, "Password must be at least 5 characters")
});

export const createUserSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(5, "Password must be at least 5 characters"),
    role: z.enum(["ADMIN", "ATTENDANT"], { message: "Invalid role" })
});

export const createClientSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    phone: z.string().optional()
});

export const registerClientSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phone: z.string().min(1, "Phone is required")
});

export const updateClientSchema = createClientSchema.partial();