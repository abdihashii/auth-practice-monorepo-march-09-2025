import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'superadmin']);

export const authSchema = pgSchema('auth');

export const authUsersTable = authSchema.table('users', {
  // Core user information
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  hashedPassword: varchar('hashed_password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  role: userRoleEnum('role').notNull().default('user'),

  // JWT management
  refreshToken: text('refresh_token'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
    withTimezone: true,
  }),
  lastTokenInvalidation: timestamp('last_token_invalidation', {
    withTimezone: true,
  }),

  // Email verification
  emailVerified: boolean('email_verified').default(false),
  verificationToken: text('verification_token'),
  verificationTokenExpiresAt: timestamp('verification_token_expires_at', {
    withTimezone: true,
  }),

  // Password reset
  resetToken: text('reset_token'),
  resetTokenExpiresAt: timestamp('reset_token_expires_at', {
    withTimezone: true,
  }),
  lastPasswordChange: timestamp('last_password_change', {
    withTimezone: true,
  }),

  // Account status & management
  isActive: boolean('is_active').default(true),
}, (table) => [
  index('idx_auth_users_email').on(table.email),
  index('idx_auth_users_refresh_token').on(table.refreshToken),
  index('idx_auth_users_verification_token').on(table.verificationToken),
  index('idx_auth_users_reset_token').on(table.resetToken),
]);

export const profilesTable = pgTable('profiles', {
  // Core profile information
  userId: uuid('user_id').primaryKey().references(() => authUsersTable.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  bio: text('bio'),
  profilePicture: varchar('profile_picture', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),

  // User settings & preferences
  settings: jsonb('settings').default({
    theme: 'system',
    language: 'en',
    timezone: 'UTC',
  } as Record<string, unknown>),
  notificationPreferences: jsonb('notification_preferences').default({
    email: {
      enabled: true,
      digest: 'daily',
      marketing: false,
    },
    push: {
      enabled: true,
      alerts: true,
    },
  } as Record<string, unknown>),

  // Activity tracking
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
  lastSuccessfulLogin: timestamp('last_successful_login', {
    withTimezone: true,
  }),
  loginCount: integer('login_count').default(0),
}, (table) => [
  index('idx_profiles_last_activity_at').on(table.lastActivityAt),
]);

// Relationships
export const authUsersRelations = relations(authUsersTable, ({ one }) => ({
  profile: one(profilesTable, {
    fields: [authUsersTable.id],
    references: [profilesTable.userId],
  }),
}));
export const profilesRelations = relations(profilesTable, ({ one }) => ({
  user: one(authUsersTable, {
    fields: [profilesTable.userId],
    references: [authUsersTable.id],
  }),
}));
