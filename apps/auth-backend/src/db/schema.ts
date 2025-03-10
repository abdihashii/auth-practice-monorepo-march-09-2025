import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  // Core user information
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  hashedPassword: varchar("hashed_password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),

  // JWT management
  refreshToken: text("refresh_token"), // Using text instead of varchar for tokens as they have variable length with no practical size limit
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  lastTokenInvalidation: timestamp("last_token_invalidation", {
    withTimezone: true,
  }),

  // Email verification
  emailVerified: boolean("email_verified").default(false),
  verificationToken: text("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry", {
    withTimezone: true,
  }),

  // Password reset
  resetToken: text("reset_token"), // Using text instead of varchar for tokens as they have variable length with no practical size limit
  resetTokenExpiresAt: timestamp("reset_token_expires_at", {
    withTimezone: true,
  }),
  lastPasswordChange: timestamp("last_password_change", {
    withTimezone: true,
  }),

  // Account status & management
  isActive: boolean("is_active").default(true),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),

  // User preferences & settings
  settings: jsonb("settings").default({
    theme: "system",
    language: "en",
    timezone: "UTC",
  } as Record<string, unknown>),
  notificationPreferences: jsonb("notification_preferences").default({
    email: {
      enabled: true,
      digest: "daily",
      marketing: false,
    },
    push: {
      enabled: true,
      alerts: true,
    },
  } as Record<string, unknown>),

  // Activity tracking
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
  lastSuccessfulLogin: timestamp("last_successful_login", {
    withTimezone: true,
  }),
  loginCount: integer("login_count").default(0),
});
