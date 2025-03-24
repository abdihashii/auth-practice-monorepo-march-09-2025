import type { PgColumn } from 'drizzle-orm/pg-core';

/**
 * Helper function to create a select object for Drizzle ORM from selectable columns
 *
 * @param {T} table - The table to select from
 * @param {Record<string, boolean>} columns - The columns to select
 * @returns {Record<string, PgColumn<any>>} A record mapping column names to their PgColumn objects
 */
export function createSelectObject<T extends Record<string, any>>(
  table: T,
  columns: { [K in keyof T]?: boolean },
): Record<string, PgColumn<any>> {
  const selectObj: Record<string, PgColumn<any>> = {};

  Object.entries(columns).forEach(([key, value]) => {
    if (value && key in table) {
      selectObj[key] = table[key as keyof typeof table] as PgColumn<any>;
    }
  });

  return selectObj;
}
