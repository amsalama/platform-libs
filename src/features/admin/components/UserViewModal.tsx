import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, 
  UserCircle2, 
  Mail, 
  Clock, 
  Globe, 
  Hash,
  Copy,
  CheckCircle2,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import type { UserResponse } from '@/types/user'

interface UserViewModalProps {
  user: UserResponse | null
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
      {copied ? (
        <CheckCircle2 className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
    </Button>
  )
}

function InfoRow({ label, value, icon: Icon, copyable, mono }: { 
  label: string
  value: string | React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  copyable?: boolean
  mono?: boolean
}) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className={`text-sm text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
        {copyable && typeof value === 'string' && <CopyButton text={value} />}
      </div>
    </div>
  )
}

export function UserViewModal({ user }: UserViewModalProps) {
  if (!user) return null

  const getRelativeTime = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const getProviderName = (issuer: string) => {
    if (issuer.includes('zitadel')) return 'Zitadel'
    if (issuer.includes('keycloak')) return 'Keycloak'
    if (issuer.includes('google')) return 'Google'
    if (issuer.includes('microsoft')) return 'Microsoft'
    if (issuer.includes('auth0')) return 'Auth0'
    if (issuer.includes('okta')) return 'Okta'
    return issuer.split('/').pop() || 'Unknown'
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-2 ring-primary/10">
          <UserCircle2 className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{user.name || 'Unnamed User'}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Mail className="h-3 w-3" />
            {user.email || 'No email'}
          </p>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-9">
          <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
          <TabsTrigger value="identity" className="text-xs">Identity</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs">Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="mt-4 space-y-1">
          <InfoRow 
            label="Principal ID" 
            value={user.principal_id} 
            icon={Hash}
            copyable
            mono
          />
          <InfoRow 
            label="Email" 
            value={user.email || '—'} 
            icon={Mail}
            copyable={!!user.email}
          />
          <InfoRow 
            label="Display Name" 
            value={user.name || '—'} 
            icon={UserCircle2}
          />
          <InfoRow 
            label="Created" 
            value={new Date(user.created_at).toLocaleString()} 
            icon={Calendar}
          />
        </TabsContent>
        
        <TabsContent value="identity" className="mt-4 space-y-1">
          <InfoRow 
            label="Identity Provider" 
            value={
              <Badge variant="outline" className="text-xs">
                {getProviderName(user.idp_issuer)}
              </Badge>
            } 
            icon={Globe}
          />
          <InfoRow 
            label="Issuer URL" 
            value={user.idp_issuer} 
            icon={ExternalLink}
            copyable
            mono
          />
          <InfoRow 
            label="Subject ID" 
            value={user.idp_subject} 
            icon={Hash}
            copyable
            mono
          />
        </TabsContent>
        
        <TabsContent value="activity" className="mt-4 space-y-1">
          <InfoRow 
            label="Last Seen" 
            value={
              user.last_seen_at ? (
                <div className="text-right">
                  <div className="text-sm">{getRelativeTime(user.last_seen_at)}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(user.last_seen_at).toLocaleString()}
                  </div>
                </div>
              ) : (
                <Badge variant="secondary" className="text-xs">Never</Badge>
              )
            } 
            icon={Clock}
          />
          <InfoRow 
            label="Account Created" 
            value={
              <div className="text-right">
                <div className="text-sm">{getRelativeTime(user.created_at)}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(user.created_at).toLocaleString()}
                </div>
              </div>
            } 
            icon={Calendar}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
