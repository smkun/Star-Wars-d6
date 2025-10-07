/**
 * Audit logging utilities
 *
 * Creates audit log entries for admin actions
 */

import { Timestamp, FieldValue } from 'firebase-admin/firestore';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'import'
  | 'upload';

export interface AuditLogEntry {
  uid: string;
  email: string;
  action: AuditAction;
  slug?: string;
  timestamp: Timestamp | FieldValue;
  details?: Record<string, unknown>;
}

/**
 * Create audit log entry
 * @param uid - User ID
 * @param email - User email
 * @param action - Action performed
 * @param slug - Optional species slug
 * @param details - Optional additional details
 * @returns Audit log entry
 */
export function createAuditLog(
  uid: string,
  email: string,
  action: AuditAction,
  slug?: string,
  details?: Record<string, unknown>
): AuditLogEntry {
  const timestamp = Timestamp.now();

  return {
    uid,
    email,
    action,
    ...(slug && { slug }),
    timestamp,
    ...(details && { details }),
  };
}
