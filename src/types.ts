export type EntryType = 'food' | 'exercise';

export interface UserProfile {
  userId: string;
  email: string;
  targetCalories?: number;
  weight?: number;
  height?: number;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  defaultDailyBurn?: number;
}

export interface CalorieEntry {
  id: string;
  userId: string;
  type: EntryType;
  name: string;
  calories: number;
  price?: number;
  timestamp: string; // ISO 8601
  dateStr: string; // YYYY-MM-DD
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}
