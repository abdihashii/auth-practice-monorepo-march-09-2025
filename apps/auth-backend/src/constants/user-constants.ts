import type { SelectableUserColumns } from "@/types";

/**
 * Default columns for user list views
 */
export const DEFAULT_USER_LIST_COLUMNS: SelectableUserColumns = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
  isActive: true,
};

/**
 * Default columns for user detail views
 */
export const DEFAULT_USER_DETAIL_COLUMNS: SelectableUserColumns = {
  ...DEFAULT_USER_LIST_COLUMNS,
  emailVerified: true,
  lastActivityAt: true,
  settings: true,
};
