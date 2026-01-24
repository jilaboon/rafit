import { UserRole } from '@prisma/client';

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      tenantId?: string;
      role?: string;
    };
  }

  interface User {
    id: string;
    tenantId?: string;
    role?: string;
  }
}

// JWT types are inferred from the callbacks in auth config

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Common entity interfaces
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeleteEntity extends BaseEntity {
  deletedAt: Date | null;
}

// User types
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  status: string;
}

export interface TenantUserProfile extends UserProfile {
  tenantId: string;
  role: UserRole;
  permissions: Record<string, boolean>;
  isActive: boolean;
}

// Tenant types
export interface TenantSettings {
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
  };
  booking?: {
    advanceBookingDays?: number;
    cancellationHours?: number;
    allowWaitlist?: boolean;
    maxWaitlistSize?: number;
  };
  notifications?: {
    emailEnabled?: boolean;
    smsEnabled?: boolean;
    reminderHours?: number;
  };
  payment?: {
    currency?: string;
    taxRate?: number;
    allowCash?: boolean;
  };
}

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  timezone: string;
  currency: string;
  locale: string;
  settings: TenantSettings;
}

// Branch types
export interface BranchInfo {
  id: string;
  name: string;
  slug: string;
  address?: string;
  city?: string;
  phone?: string;
  timezone: string;
  isActive: boolean;
}

// Service types
export interface ServiceInfo {
  id: string;
  name: string;
  description?: string;
  type: 'GROUP_CLASS' | 'PERSONAL' | 'WORKSHOP' | 'COURSE';
  duration: number;
  defaultCapacity: number;
  color?: string;
  price?: number;
  creditCost: number;
  isActive: boolean;
}

// Class/Schedule types
export interface ClassInfo {
  id: string;
  name: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  capacity: number;
  bookedCount: number;
  waitlistCount: number;
  coachName?: string;
  roomName?: string;
  isCancelled: boolean;
}

// Booking types
export interface BookingInfo {
  id: string;
  customerId: string;
  customerName: string;
  classId: string;
  className: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW' | 'COMPLETED' | 'WAITLISTED';
  waitlistPosition?: number;
  bookedAt: Date;
  checkedInAt?: Date;
}

// Customer types
export interface CustomerInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  tags: string[];
  leadStatus: string;
  membershipStatus?: string;
}

// Membership types
export interface MembershipInfo {
  id: string;
  planName: string;
  planType: 'SUBSCRIPTION' | 'PUNCH_CARD' | 'CREDITS' | 'TRIAL' | 'DROP_IN';
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'CANCELLED';
  startDate: Date;
  endDate?: Date;
  sessionsRemaining?: number;
  creditsRemaining?: number;
}

// Payment types
export interface PaymentInfo {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  description?: string;
  createdAt: Date;
}

// Form state types
export interface FormState {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

// Navigation types
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  permission?: string;
  children?: NavItem[];
}

// Table types
export interface TableColumn<T> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface TableState {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, unknown>;
}

// Dashboard types
export interface DashboardStats {
  todayClasses: number;
  todayBookings: number;
  todayRevenue: number;
  activeMembers: number;
  pendingPayments: number;
  newLeadsThisWeek: number;
}

// Date/Time helpers
export type TimeSlot = {
  start: string; // HH:mm
  end: string; // HH:mm
};

export type DaySchedule = {
  dayOfWeek: number;
  slots: TimeSlot[];
  isAvailable: boolean;
};
