'use client';

import { CheckIcon, XIcon } from 'lucide-react';
import React from 'react';

import { checkPasswordRequirements, cn } from '@/lib/utils';

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
