import { useState } from 'react'
import { useAuth } from '@/features/auth/context'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserRole } from '@/types'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { user, session, canEdit, updateProfile, updatePassword, updateEmail } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  // Profile form state
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [email, setEmail] = useState(session?.user?.email || '')

  // Password form state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Add user dialog state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [newUserFullName, setNewUserFullName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState<UserRole>('READ_ONLY')

  const resetAddUserForm = () => {
    setNewUserFullName('')
    setNewUserEmail('')
    setNewUserPassword('')
    setNewUserRole('READ_ONLY')
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newUserPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setIsCreatingUser(true)
    try {
      const { error } = await supabase.functions.invoke('create-user', {
        body: {
          email: newUserEmail,
          password: newUserPassword,
          full_name: newUserFullName,
          role: newUserRole,
        },
      })

      if (error) throw error

      toast.success(`${newUserFullName} was added as ${newUserRole === 'READ_ONLY' ? 'Read Only' : 'Super Admin'}`)
      resetAddUserForm()
      setIsAddUserOpen(false)
    } catch (error: any) {
      toast.error(error?.context?.error || error?.message || 'Failed to create user')
      console.error(error)
    } finally {
      setIsCreatingUser(false)
    }
  }

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
                    Takes effect immediately, use it the next time you sign in
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

      {canEdit && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <div>
              <CardTitle>Team</CardTitle>
              <CardDescription>Add a new user and set their access level</CardDescription>
            </div>
            <Dialog
              open={isAddUserOpen}
              onOpenChange={(open) => {
                setIsAddUserOpen(open)
                if (!open) resetAddUserForm()
              }}
            >
              <DialogTrigger asChild>
                <Button>Add User</Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateUser}>
                  <DialogHeader>
                    <DialogTitle>Add User</DialogTitle>
                    <DialogDescription>
                      They can sign in immediately with this email and password, and change either from their own
                      Settings page.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="newUserFullName">Full Name</Label>
                      <Input
                        id="newUserFullName"
                        value={newUserFullName}
                        onChange={(e) => setNewUserFullName(e.target.value)}
                        placeholder="Jane Doe"
                        required
                        disabled={isCreatingUser}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newUserEmail">Email</Label>
                      <Input
                        id="newUserEmail"
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="jane@example.com"
                        required
                        disabled={isCreatingUser}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newUserPassword">Temporary Password</Label>
                      <Input
                        id="newUserPassword"
                        type="password"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        required
                        disabled={isCreatingUser}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newUserRole">Access Level</Label>
                      <Select
                        value={newUserRole}
                        onValueChange={(value) => setNewUserRole(value as UserRole)}
                        disabled={isCreatingUser}
                      >
                        <SelectTrigger id="newUserRole">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="READ_ONLY">Read Only — can view, not edit</SelectItem>
                          <SelectItem value="SUPER_ADMIN">Super Admin — full access</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isCreatingUser}>
                      {isCreatingUser ? 'Creating...' : 'Create User'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
