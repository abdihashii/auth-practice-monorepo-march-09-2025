'use client';

import { PASSWORD_REQUIREMENTS } from '@roll-your-own-auth/shared/types';
import { CheckIcon, XIcon } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

// Regex for allowed symbols
const allowedSymbolsRegex = new RegExp(
  `[${PASSWORD_REQUIREMENTS.allowedSymbols.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`,
  'g',
);

interface RequirementCheck {
  id: string;
  label: string;
  isMet: boolean;
}

// Function to check requirements
function checkPasswordRequirements(password: string): RequirementCheck[] {
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

interface PasswordRequirementsCheckerProps {
  password?: string;
  className?: string;
  id?: string; // For aria-describedby
}

// Rename component
export function PasswordRequirementsChecker({
  password = '',
  className,
  id,
}: PasswordRequirementsCheckerProps) {
  const listId = React.useId();

  // Don't render if password is empty
  if (!password) {
    return null;
  }

  const requirementChecks = checkPasswordRequirements(password);
  const allMet = requirementChecks.every((check) => check.isMet);

  return (
    <div
      id={id} // Use the passed id for linking
      className={cn('text-sm', className)}
      aria-live="polite"
      role="region" // Add role for better semantics
      aria-label="Password requirements status"
    >
      {allMet
        ? (
            <div className="flex items-center text-green-600">
              <CheckIcon className="mr-1 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span>Password meets all requirements</span>
            </div>
          )
        : (
            <ul aria-labelledby={listId} className="grid gap-1 list-none p-0 m-0">
              <span id={listId} className="sr-only">Password must contain:</span>
              {requirementChecks.map((check) => (
                <li key={check.id} className="flex items-center">
                  {check.isMet
                    ? (
                        <CheckIcon
                          className="mr-1 h-4 w-4 flex-shrink-0 text-green-600"
                          aria-hidden="true"
                        />
                      )
                    : (
                        <XIcon
                          className="mr-1 h-4 w-4 flex-shrink-0 text-red-500"
                          aria-hidden="true"
                        />
                      )}
                  <span className={cn(check.isMet ? 'text-muted-foreground' : 'text-foreground')}>
                    {check.label}
                  </span>
                </li>
              ))}
            </ul>
          )}
    </div>
  );
}
