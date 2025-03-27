import { z } from 'zod';

import { PASSWORD_REQUIREMENTS } from '@/types';

/**
 **************************************************
 ******** SHARED AUTH VALIDATION SCHEMAS **********
 **************************************************
 */

/**
 * Validation schema for email
 * Ensures the email is a valid format
 */
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must be less than 255 characters');

/**
 * Validation schema for password
 * Ensures the password
 */
export const passwordSchema = z
  .string()
  .min(
    PASSWORD_REQUIREMENTS.minLength,
    `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`,
  )
  .max(
    PASSWORD_REQUIREMENTS.maxLength,
    `Password must be less than ${PASSWORD_REQUIREMENTS.maxLength} characters`,
  )
  .refine(
    (password) =>
      (password.match(/[a-z]/g) || []).length
      >= PASSWORD_REQUIREMENTS.minLowercase,
    {
      message: 'Password must contain at least one lowercase letter',
    },
  )
  .refine(
    (password) =>
      (password.match(/[A-Z]/g) || []).length
      >= PASSWORD_REQUIREMENTS.minUppercase,
    {
      message: 'Password must contain at least one uppercase letter',
    },
  )
  .refine(
    (password) =>
      (password.match(/\d/g) || []).length
      >= PASSWORD_REQUIREMENTS.minNumbers,
    {
      message: 'Password must contain at least one number',
    },
  )
  .refine(
    (password) => {
      const symbols = new RegExp(
        `[${PASSWORD_REQUIREMENTS.allowedSymbols.replace(
          /[-[\]{}()*+?.,\\^$|#\s]/g,
          '\\$&',
        )}]`,
        'g',
      );
      return (
        (password.match(symbols) || []).length
        >= PASSWORD_REQUIREMENTS.minSymbols
      );
    },
    {
      message: 'Password must contain at least one special character',
    },
  );

/*
  **************************************************
  ********** AUTH FORM VALIDATION SCHEMAS **********
  **************************************************
  */
export const loginFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerFormSchema = loginFormSchema
  .extend({
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/*
  **************************************************
  ********** BACKEND AUTH VALIDATION SCHEMAS *******
  **************************************************
  */

/**
 * Validation schema for user registration
 * Validates the CreateUserDto structure with proper constraints
 */
export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
});

/**
 * Validation schema for user login
 * Validates the LoginUserDto structure with proper constraints
 */
export const loginUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
