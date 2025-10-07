/**
 * Firestore collection and document type definitions
 */

export interface MetaConfig {
  schemaVersion: number;
  lastImportHash: string;
}

export interface AdminLog {
  uid: string;
  email: string;
  action: 'create' | 'update' | 'delete' | 'import' | 'upload';
  slug?: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}
