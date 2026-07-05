export type UserRole = 'SUPER_ADMIN'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface PaymentMethod {
  id: string
  card_number: string
  card_holder_name: string
  expiration: string
  cvv: string
  country: string
  street: string
  notes?: string
  created_at: string
}

export interface Gmail {
  id: string
  gmail_address: string
  password: string
  status: 'unused' | 'used' | 'sold'
  notes?: string
  created_at: string
  created_by?: string
  console_id?: string
  certificate_id?: string
}

export interface BusinessCertificate {
  id: string
  business_name: string
  city: string
  duns_number: string
  website?: string
  notes?: string
  times_used?: number
  created_at: string
}

export type ConsoleStatus = 'approved' | 'in_review' | 'production' | 'rejected' | 'faulty' | 'sold'

export interface ConsoleAccount {
  id: string
  console_name: string
  gmail_id: string
  certificate_id: string
  status: ConsoleStatus
  notes?: string
  review_started_at?: string
  days_in_review?: number
  sold_at?: string
  created_at: string
}

export type ApplicationStatus = 'idea' | 'development' | 'internal_testing' | 'closed_testing' | 'open_testing' | 'under_review' | 'production' | 'suspended' | 'removed'

export interface Application {
  id: string
  console_id: string
  app_name: string
  package_name: string
  short_description: string
  full_description: string
  category: string
  version: string
  release_date?: string
  status: ApplicationStatus
  app_icon_url?: string
  privacy_policy_url?: string
  screenshots?: string[]
  notes?: string
  review_started_at?: string
  days_in_review?: number
  sold_at?: string
  created_at: string
  updated_at: string
}

export type AppIdeaStatus = 'planned' | 'in_progress' | 'implemented' | 'archived'

export interface AppIdea {
  id: string
  title: string
  description: string
  category: string
  priority: 'low' | 'medium' | 'high'
  estimated_complexity: 'low' | 'medium' | 'high'
  status: AppIdeaStatus
  notes?: string
  created_at: string
  updated_at: string
  converted_app_id?: string
}

// Dashboard types
export interface DashboardStats {
  totalGmails: number
  usedGmails: number
  unusedGmails: number
  gmailsLinkedToConsoles: number
  totalConsoles: number
  approvedConsoles: number
  pendingConsoles: number
  suspendedConsoles: number
  rejectedConsoles: number
  totalCertificates: number
  totalApps: number
  appsUnderReview: number
  appsInProduction: number
  suspendedApps: number
  removedApps: number
  draftApps: number
  totalAppIdeas: number
}

// Review-time analytics (accounts & apps)
export interface ReviewTimeStats {
  avgDaysInReview: number | null
  completedCount: number
  inReviewCount: number
  avgDaysInReviewSoFar: number | null
}

// App sales analytics (an app counts as "sold" when its console is sold)
export interface WeekSalesBucket {
  label: string
  count: number
}

export interface MonthSalesBucket {
  label: string
  count: number
}

export interface SalesAnalytics {
  soldThisWeek: number
  soldThisMonth: number
  soldAllTime: number
  weekly: WeekSalesBucket[]
  monthly: MonthSalesBucket[]
}

export interface ConsoleStatusHistoryEntry {
  id: string
  console_id: string
  from_status: ConsoleStatus
  to_status: ConsoleStatus
  started_at: string
  changed_at: string
  duration_days: number
}

export interface ApplicationStatusHistoryEntry {
  id: string
  application_id: string
  from_status: ApplicationStatus
  to_status: ApplicationStatus
  started_at: string
  changed_at: string
  duration_days: number
}

export interface ActivityLog {
  id: string
  user_id: string
  action: string
  resource_type: string
  resource_id: string
  created_at: string
}
