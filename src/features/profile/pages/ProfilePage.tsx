import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Shield, Clock, Mail, Globe, Calendar, MapPin } from 'lucide-react'

export default function ProfilePage() {
  const { user, tokenExpiry } = useAuthStore()

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">Manage your account and view your permissions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>Your account details and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <p className="text-sm font-medium">{user.name}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Username</label>
              <p className="text-sm font-mono">{user.preferred_username}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="h-3 w-3" />
                Email
              </label>
              <div className="flex items-center gap-2">
                <p className="text-sm">{user.email}</p>
                {user.email_verified ? (
                  <Badge variant="default" className="text-xs">Verified</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Unverified</Badge>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                Principal ID
              </label>
              <p className="text-xs font-mono text-muted-foreground">{user.principal_id}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Globe className="h-3 w-3" />
                Tenant ID
              </label>
              <p className="text-sm font-mono">{user.tenant_id || 'None'}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Authenticated At
              </label>
              <p className="text-sm">{new Date(user.authenticated_at).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Roles & Permissions
          </CardTitle>
          <CardDescription>Your assigned roles and permissions within the system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-3 block">Assigned Roles</label>
            <div className="flex flex-wrap gap-2">
              {user.roles.length ? (
                user.roles.map((role) => (
                  <Badge key={role} variant="secondary" className="text-sm px-3 py-1">
                    {role}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">No roles assigned</p>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-3 block">Permissions</label>
            <div className="flex flex-wrap gap-2">
              {user.permissions.length ? (
                user.permissions.map((permission) => (
                  <Badge key={permission} variant="outline" className="text-xs">
                    {permission}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">No permissions assigned</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Session Information
          </CardTitle>
          <CardDescription>Your current authentication session details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Access Token</label>
            <div className="flex gap-2">
              <code className="flex-1 rounded-md bg-muted px-3 py-2 text-xs font-mono overflow-x-auto">
                {accessToken ? `${accessToken.substring(0, 30)}...${accessToken.substring(accessToken.length - 10)}` : 'Not available'}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyToken}
                disabled={!accessToken}
                title={copied ? 'Copied!' : 'Copy token'}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div> */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Token Expires</label>
              <p className="text-sm">
                {tokenExpiry
                  ? new Date(tokenExpiry).toLocaleString()
                  : 'Unknown'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Time Remaining</label>
              <p className="text-sm">
                {tokenExpiry
                  ? `${Math.max(0, Math.floor((tokenExpiry - Date.now()) / 60000))} minutes`
                  : 'Unknown'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
