import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Email invalide').transform((v) => v.trim().toLowerCase()),
  password: z.string().min(8, 'Mot de passe : 8 caractères minimum'),
  displayName: z.string().trim().min(1).max(80).optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Email invalide').transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1, 'Mot de passe requis'),
})

export const recurrenceSchema = z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'ONDAY'])
export const prioritySchema = z.enum(['VHIGH', 'HIGH', 'MEDIUM', 'LOW', 'VLOW'])
export const weekdaySchema = z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])
export const historyStatusSchema = z.enum(['DONE', 'MISSED'])

export const todoInputSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  recurrence: recurrenceSchema,
  days: z.array(weekdaySchema).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  earlyCompletable: z.boolean().optional(),
  priority: prioritySchema,
  color: z.string().max(32).optional(),
  enabled: z.boolean().optional(),
  archived: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export const todoUpdateSchema = todoInputSchema.partial()

export const historyInputSchema = z.object({
  id: z.string().min(1).optional(),
  todoId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: historyStatusSchema,
  createdAt: z.string().optional(),
})

export const historyUpdateSchema = z.object({
  status: historyStatusSchema,
})

export const badgesReplaceSchema = z.object({
  unlocked: z.record(z.string(), z.object({ unlockedAt: z.string() })).default({}),
  hasTraveled: z.boolean().optional(),
})
