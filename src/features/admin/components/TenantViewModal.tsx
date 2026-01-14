import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, 
  Building, 
  Hash,
  Copy,
  CheckCircle2,
  Link2,
  Settings,
  Clock,
  Shield,
  Zap,
  AlertCircle,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import type { TenantResponse } from '@/types/tenant'

interface TenantViewModalProps {
  tenant: TenantResponse | null
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

export function TenantViewModal({ tenant }: TenantViewModalProps) {
  if (!tenant) return null

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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { variant: 'default' as const, icon: Check, color: 'text-green-500' }
      case 'SUSPENDED':
        return { variant: 'destructive' as const, icon: AlertCircle, color: 'text-red-500' }
      case 'PENDING_DELETION':
        return { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-500' }
      default:
        return { variant: 'secondary' as const, icon: Shield, color: 'text-muted-foreground' }
    }
  }

  const statusConfig = getStatusConfig(tenant.status)
  const StatusIcon = statusConfig.icon
  const entitlementCount = Object.keys(tenant.entitlements || {}).length
  const settingsCount = Object.keys(tenant.settings || {}).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center ring-2 ring-green-500/10">
          <Building className="h-8 w-8 text-green-500" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{tenant.name}</h2>
            <Badge variant={statusConfig.variant} className="text-[10px]">
              <StatusIcon className={`h-3 w-3 mr-1 ${statusConfig.color}`} />
              {tenant.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
            <Link2 className="h-3 w-3" />
            <code className="text-xs">{tenant.slug}</code>
          </p>
        </div>
      </div>
      
      <div>
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-9">
            <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
            <TabsTrigger value="entitlements" className="text-xs">Features ({entitlementCount})</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">Settings ({settingsCount})</TabsTrigger>
            <TabsTrigger value="audit" className="text-xs">Audit</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-4 space-y-1">
            <InfoRow 
              label="Tenant ID" 
              value={tenant.id} 
              icon={Hash}
              copyable
              mono
            />
            <InfoRow 
              label="Name" 
              value={tenant.name} 
              icon={Building}
            />
            <InfoRow 
              label="Slug" 
              value={tenant.slug} 
              icon={Link2}
              copyable
              mono
            />
            <InfoRow 
              label="Status" 
              value={
                <div className="flex items-center gap-1.5">
                  <StatusIcon className={`h-3.5 w-3.5 ${statusConfig.color}`} />
                  <Badge variant={statusConfig.variant} className="text-xs">
                    {tenant.status}
                  </Badge>
                </div>
              } 
              icon={Shield}
            />
            {tenant.description && (
              <div className="pt-3 mt-3 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">Description</p>
                <p className="text-sm">{tenant.description}</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="entitlements" className="mt-4">
            {entitlementCount > 0 ? (
              <div className="space-y-2">
                {Object.entries(tenant.entitlements).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-primary" />
                      <span className="text-sm font-medium">{key}</span>
                    </div>
                    <Badge variant="outline" className="text-xs font-mono">
                      {typeof value === 'boolean' ? (value ? 'Enabled' : 'Disabled') : String(value)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No entitlements configured</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="settings" className="mt-4">
            {settingsCount > 0 ? (
              <div className="rounded-lg bg-muted/50 p-3 overflow-auto max-h-64">
                <pre className="text-xs font-mono">
                  {JSON.stringify(tenant.settings, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No custom settings configured</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="audit" className="mt-4 space-y-1">
            <InfoRow 
              label="Created" 
              value={
                <div className="text-right">
                  <div className="text-sm">{getRelativeTime(tenant.created_at)}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(tenant.created_at).toLocaleString()}
                  </div>
                </div>
              } 
              icon={Calendar}
            />
            <InfoRow 
              label="Last Updated" 
              value={
                tenant.updated_at ? (
                  <div className="text-right">
                    <div className="text-sm">{getRelativeTime(tenant.updated_at)}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(tenant.updated_at).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">Never modified</span>
                )
              } 
              icon={Clock}
            />
            
            {tenant.status === 'SUSPENDED' && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-red-600">Tenant Suspended</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This tenant has been suspended. Users cannot access resources until the tenant is reactivated.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {tenant.status === 'PENDING_DELETION' && (
              <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-yellow-600">Pending Deletion</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This tenant is scheduled for deletion. All data will be permanently removed.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
