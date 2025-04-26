import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgPolicy,
  pgRole,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// Create a role for the application to use
export const appUserRole = pgRole('app_user', { createRole: true, createDb: true, inherit: true });

// Create an enum for the role column in the auth.users table
export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'superadmin']);

// Enum for authentication providers
export const authProviderEnum = pgEnum('auth_provider', ['email', 'google', 'github', 'apple']);

// Create a new schema in the database
export const authSchema = pgSchema('auth');

// Create the users table in the auth schema
export const authUsersTable = authSchema.table('users', {
  // Core user information
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  hashedPassword: varchar('hashed_password', { length: 255 }), // Nullable for OAuth users
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  role: userRoleEnum('role').notNull().default('user'),

  // JWT management
  refreshToken: text('refresh_token'), // Using text instead of varchar for tokens as they have variable length with no practical size limit
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
    withTimezone: true,
  }),
  lastTokenInvalidation: timestamp('last_token_invalidation', {
    withTimezone: true,
  }),

  // Email verification - Still relevant for account recovery and primary email confirmation
  emailVerified: boolean('email_verified').default(false),
  verificationToken: text('verification_token'),
  verificationTokenExpiresAt: timestamp('verification_token_expires_at', {
    withTimezone: true,
  }),

  // Password reset - Still relevant if user sets a password later or started with email/password
  resetToken: text('reset_token'), // Using text instead of varchar for tokens as they have variable length with no practical size limit
  resetTokenExpiresAt: timestamp('reset_token_expires_at', {
    withTimezone: true,
  }),
  lastPasswordChange: timestamp('last_password_change', {
    withTimezone: true,
  }),

  // Account status & management
  isActive: boolean('is_active').default(true),
}, (t) => [
  pgPolicy('users_policy', {
    using: sql`
      ((select auth.get_current_user_id()) IS NOT NULL AND (select auth.get_current_user_id()) = ${t.id})
      OR
      (auth.is_service_request() = TRUE)
    `,
  }),
]).enableRLS();

// Create the user connections table in the auth schema
export const authUserConnections = authSchema.table('user_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => authUsersTable.id, { onDelete: 'cascade' }),
  provider: authProviderEnum('provider').notNull(),
  providerUserId: text('provider_user_id').notNull(), // Unique ID from the provider (e.g., Google's sub)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  // Optional: Store provider-specific email or access/refresh tokens here if needed,
  // but consider security implications (encryption at rest).
  // providerEmail: text('provider_email'),
}, (t) => [
  uniqueIndex('user_provider_idx').on(t.userId, t.provider), // User can only have one connection per provider
  uniqueIndex('provider_user_id_idx').on(t.provider, t.providerUserId), // Provider ID must be unique for that provider
  pgPolicy('user_connections_policy', {
    using: sql`
      ((select auth.get_current_user_id()) IS NOT NULL AND (select auth.get_current_user_id()) = ${t.userId})
      OR
      (auth.is_service_request() = TRUE)
    `,
  }),
]).enableRLS();

// Create the profiles table in the public schema
export const profilesTable = pgTable('profiles', {
  // Core profile information
  userId: uuid('user_id').primaryKey().references(() => authUsersTable.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  bio: text('bio'),
  profilePicture: text('profile_picture'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),

  // User preferences & settings
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
}, (t) => [
  pgPolicy('profiles_policy', {
    using: sql`
      ((select auth.get_current_user_id()) IS NOT NULL AND (select auth.get_current_user_id()) = ${t.userId})
      OR
      (auth.is_service_request() = TRUE)
    `,
  }),
]).enableRLS();

// Relationships
export const authUsersRelations = relations(authUsersTable, ({ one, many }) => ({
  // One to one relationship between users and profiles table. Meaning each
  // user can have only one profile.
  profile: one(profilesTable, {
    fields: [authUsersTable.id],
    references: [profilesTable.userId],
  }),
  // One to many relationship between users and user connections table.
  // Meaning each user can have many connections to different providers, i.e.
  // a single user can have both a Google and a GitHub connection, for example.
  connections: many(authUserConnections),
}));

export const authUserConnectionsRelations = relations(authUserConnections, ({ one }) => ({
  // One to one relationship between user connections and users table.
  // Meaning each user connection belongs to a single user.
  user: one(authUsersTable, {
    fields: [authUserConnections.userId],
    references: [authUsersTable.id],
  }),
}));

export const profilesRelations = relations(profilesTable, ({ one }) => ({
  user: one(authUsersTable, {
    fields: [profilesTable.userId],
    references: [authUsersTable.id],
  }),
}));
