import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from '@/features/auth/context'
import LoginPage from '@/features/auth/pages/LoginPage'
import RootLayout from '@/layouts/RootLayout'
import { LoadingState } from '@/components/shared/loading-state'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

function AppContent() {
  const { session, loading } = useAuth()

  if (loading) {
    return <LoadingState message="Initializing..." className="h-screen" />
  }

  if (!session) {
    return <LoginPage />
  }

  return <RootLayout />
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
