import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { auth } from '../firebase';
import { OperationType, FirestoreErrorInfo } from '../types';
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeParseDate(timestamp: any): Date {
  if (!timestamp) return new Date();
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return isNaN(timestamp.getTime()) ? new Date() : timestamp;
  }
  if (typeof timestamp === 'string') {
    // Replace T with space or handle YYYY-MM-DD
    const normalized = timestamp.replace('T', ' ');
    let date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      date = new Date(normalized);
    }
    if (isNaN(date.getTime()) && timestamp.includes('-')) {
      const parts = timestamp.split(/[-T :]/);
      if (parts.length >= 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const hour = parts[3] ? parseInt(parts[3], 10) : 0;
        const minute = parts[4] ? parseInt(parts[4], 10) : 0;
        const second = parts[5] ? parseInt(parts[5], 10) : 0;
        date = new Date(year, month, day, hour, minute, second);
      }
    }
    return isNaN(date.getTime()) ? new Date() : date;
  }
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? new Date() : date;
}

export function safeFormatDate(timestamp: any, formatStr: string): string {
  try {
    const d = safeParseDate(timestamp);
    return format(d, formatStr);
  } catch {
    return format(new Date(), formatStr);
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function calculateBMR(profile: { weight?: number, height?: number, age?: number, gender?: string }) {
  if (!profile.weight || !profile.height || !profile.age || !profile.gender) return 2000;
  
  // Mifflin-St Jeor Equation
  let bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age;
  if (profile.gender === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }
  return bmr;
}

export function calculateTDEE(bmr: number, activityLevel?: string) {
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };
  return Math.round(bmr * (multipliers[activityLevel || 'sedentary'] || 1.2));
}
