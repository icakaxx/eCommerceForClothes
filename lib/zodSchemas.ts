/**
 * Zod validation schemas for API endpoints
 * Ensures all input is properly validated
 */

import { z } from 'zod'

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100)
})

// Register schema
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(20),
  locationText: z.string().max(500).optional(),
  locationCoordinates: z.string().optional()
})

// Update profile schema
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().min(10).max(20).optional(),
  locationText: z.string().max(500).optional(),
  locationCoordinates: z.string().optional(),
  addressInstructions: z.string().max(500).optional()
})

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email address').max(255)
})

// Password reset schema
export const passwordResetSchema = z.object({
  token: z.string().min(20),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(100)
})

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(100)
})
