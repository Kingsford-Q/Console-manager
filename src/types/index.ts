export type UserRole = 'SUPER_ADMIN'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Gmail {
  id: string
  gmail_address: string
  password: string
  recovery_email?: string
  recovery_phone?: string
  status: 'unused' | 'used'
  notes?: string
  created_at: string
  console_id?: string
  certificate_id?: string
}

export interface BusinessCertificate {
  id: string
  business_name: string
  country: string
  registration_number: string
  certificate_number: string
  notes?: string
  created_at: string
}

export type ConsoleStatus = 'pending_payment' | 'pending_verification' | 'approved' | 'suspended' | 'closed' | 'rejected'

export interface ConsoleAccount {
  id: string
  console_name: string
  gmail_id: string
  certificate_id: string
  status: ConsoleStatus
  notes?: string
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
  screenshots?: string[]
  notes?: string
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

export interface ActivityLog {
  id: string
  user_id: string
  action: string
  resource_type: string
  resource_id: string
  created_at: string
}
