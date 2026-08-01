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

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'Surnom trop court')
    .max(80, 'Surnom trop long (80 car. max)')
    .nullable(),
})

export const recurrenceSchema = z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'ONDAY'])
export const prioritySchema = z.enum(['VHIGH', 'HIGH', 'MEDIUM', 'LOW', 'VLOW'])
export const weekdaySchema = z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])
export const historyStatusSchema = z.enum(['DONE', 'MISSED'])
const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (YYYY-MM-DD)')

export const notificationPrefsSchema = z.object({
  enabled: z.boolean().optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Heure invalide (HH:mm)').optional(),
  days: z.array(weekdaySchema).min(1).optional(),
  onlyIfIncomplete: z.boolean().optional(),
  timezone: z.string().min(1).max(64).optional(),
})

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  userAgent: z.string().max(512).optional(),
})

const todoFields = {
  id: z.string().min(1).optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  recurrence: recurrenceSchema,
  days: z.array(weekdaySchema).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  earlyCompletable: z.boolean().optional(),
  deadline: dateStringSchema.nullable().optional(),
  deadlineUpdatedAt: z.string().optional(),
  priority: prioritySchema,
  color: z.string().max(32).optional(),
  enabled: z.boolean().optional(),
  archived: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}

export const todoInputSchema = z.object(todoFields).superRefine((value, ctx) => {
  if (value.recurrence === 'ONDAY' && !value.deadline) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Une échéance est requise pour une todo deadline.',
      path: ['deadline'],
    })
  }
})

export const todoUpdateSchema = z.object(todoFields).partial()

export const historyInputSchema = z.object({
  id: z.string().min(1).optional(),
  todoId: z.string().min(1),
  date: dateStringSchema,
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
