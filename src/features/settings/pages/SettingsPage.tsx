import { useState } from 'react'
import { useAuth } from '@/features/auth/context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { user, session, updateProfile, updatePassword, updateEmail } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  // Profile form state
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [email, setEmail] = useState(session?.user?.email || '')

  // Password form state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    try {
      await updateProfile({
        full_name: fullName,
      })
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error('Failed to update profile')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (email === session?.user?.email) {
      toast.error('Enter a different email address')
      return
    }

    setIsLoading(true)
    try {
      await updateEmail(email)
      toast.success('Email updated successfully. Use it next time you sign in.')
    } catch (error: any) {
      if (error?.message?.includes('rate limit') || error?.status === 429) {
        toast.error('Too many email change attempts. Please wait a few minutes before trying again.')
      } else if (error?.message?.includes('already in use') || error?.code === '23505') {
        toast.error('That email address is already in use')
      } else {
        toast.error(error?.message || 'Failed to update email')
      }
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)
    try {
      await updatePassword(newPassword)
      toast.success('Password updated successfully')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      toast.error('Failed to update password')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">Manage your account settings and preferences</p>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Updating...' : 'Update Name'}
              </Button>
            </form>

            <div className="border-t pt-4">
              <form onSubmit={handleEmailUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Takes effect immediately — use it the next time you sign in
                  </p>
                </div>
                <Button type="submit" disabled={isLoading} variant="outline" className="w-full">
                  {isLoading ? 'Updating...' : 'Update Email'}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Password Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" disabled={isLoading} variant="outline" className="w-full">
                {isLoading ? 'Updating...' : 'Change Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Account Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your current account details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y text-sm">
            <div className="flex flex-col gap-0.5 py-2.5 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium">{user?.role?.replace('_', ' ')}</span>
            </div>
            <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-muted-foreground">Account ID</span>
              <span className="break-all font-mono text-xs font-medium sm:text-sm">{user?.id}</span>
            </div>
            <div className="flex flex-col gap-0.5 py-2.5 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-muted-foreground">Member Since</span>
              <span className="font-medium">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
