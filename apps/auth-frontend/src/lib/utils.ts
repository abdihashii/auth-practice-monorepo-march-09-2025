import type { ClassValue } from 'clsx';

import { PASSWORD_REQUIREMENTS } from '@roll-your-own-auth/shared/types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Regex for allowed symbols
const allowedSymbolsRegex = new RegExp(
  `[${PASSWORD_REQUIREMENTS.allowedSymbols.replace(
    /[-[\]{}()*+?.,\\^$|#\s]/g,
    '\\$&',
  )}]`,
  'g',
);

interface RequirementCheck {
  id: string;
  label: string;
  isMet: boolean;
}

/**
 * Check the password requirements
 * @param password - The password to check
 * @returns The password requirements
 */
export function checkPasswordRequirements(password: string): RequirementCheck[] {
  const checks: RequirementCheck[] = [
    {
      id: 'length',
      label: `At least ${PASSWORD_REQUIREMENTS.minLength} characters`,
      isMet: password.length >= PASSWORD_REQUIREMENTS.minLength,
    },
    {
      id: 'lowercase',
      label: `At least ${PASSWORD_REQUIREMENTS.minLowercase} lowercase letter${PASSWORD_REQUIREMENTS.minLowercase > 1 ? 's' : ''}`,
      isMet: (
        (password.match(/[a-z]/g) || []).length
        >= PASSWORD_REQUIREMENTS.minLowercase
      ),
    },
    {
      id: 'uppercase',
      label: `At least ${PASSWORD_REQUIREMENTS.minUppercase} uppercase letter${PASSWORD_REQUIREMENTS.minUppercase > 1 ? 's' : ''}`,
      isMet: (
        (password.match(/[A-Z]/g) || []).length
        >= PASSWORD_REQUIREMENTS.minUppercase
      ),
    },
    {
      id: 'number',
      label: `At least ${PASSWORD_REQUIREMENTS.minNumbers} number${PASSWORD_REQUIREMENTS.minNumbers > 1 ? 's' : ''}`,
      isMet: (
        (password.match(/\d/g) || []).length
        >= PASSWORD_REQUIREMENTS.minNumbers
      ),
    },
    {
      id: 'symbol',
      label: `At least ${PASSWORD_REQUIREMENTS.minSymbols} symbol${PASSWORD_REQUIREMENTS.minSymbols > 1 ? 's' : ''} (${PASSWORD_REQUIREMENTS.allowedSymbols})`,
      isMet: (
        (password.match(allowedSymbolsRegex) || []).length
        >= PASSWORD_REQUIREMENTS.minSymbols
      ),
    },
  ];
  return checks;
}
