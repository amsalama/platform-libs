import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, 
  Shield, 
  Hash,
  Copy,
  CheckCircle2,
  Building,
  Users,
  Key,
  Lock,
  Clock,
  AlertTriangle,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import type { RoleResponse } from '@/types/role'

interface RoleViewModalProps {
  role: RoleResponse | null
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

export function RoleViewModal({ role }: RoleViewModalProps) {
  if (!role) return null

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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center ring-2 ring-blue-500/10">
          <Shield className="h-8 w-8 text-blue-500" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{role.name}</h2>
            {role.is_system && (
              <Badge variant="secondary" className="text-[10px]">System</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {role.description || 'No description provided'}
          </p>
        </div>
      </div>
      
      <div>
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-9">
            <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
            <TabsTrigger value="permissions" className="text-xs">
              Permissions {role.permission_count !== undefined && `(${role.permission_count})`}
            </TabsTrigger>
            <TabsTrigger value="scope" className="text-xs">Scope</TabsTrigger>
            <TabsTrigger value="audit" className="text-xs">Audit</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-4 space-y-1">
            <InfoRow 
              label="Role ID" 
              value={role.id} 
              icon={Hash}
              copyable
              mono
            />
            <InfoRow 
              label="Name" 
              value={role.name} 
              icon={Shield}
            />
            <InfoRow 
              label="Status" 
              value={
                <Badge 
                  variant={role.status === 'ACTIVE' ? 'default' : 'secondary'} 
                  className="text-xs"
                >
                  {role.status}
                </Badge>
              } 
              icon={CheckCircle2}
            />
            <InfoRow 
              label="Type" 
              value={
                <Badge 
                  variant={role.is_system ? 'secondary' : 'outline'} 
                  className="text-xs"
                >
                  {role.is_system ? 'System Role' : 'Custom Role'}
                </Badge>
              } 
              icon={role.is_system ? Lock : Key}
            />
          </TabsContent>
          
          <TabsContent value="permissions" className="mt-4">
            {role.permissions && role.permissions.length > 0 ? (
              <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                {role.permissions.map((permission) => {
                  const getRiskColor = (risk: string) => {
                    switch (risk) {
                      case 'LOW': return 'bg-green-500/10 text-green-600 border-green-500/20'
                      case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                      case 'HIGH': return 'bg-red-500/10 text-red-600 border-red-500/20'
                      default: return ''
                    }
                  }
                  return (
                    <div key={permission.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <Key className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <div className="min-w-0">
                          <code className="text-xs font-mono truncate block">{permission.permission_key}</code>
                          {permission.description && (
                            <span className="text-[10px] text-muted-foreground truncate block">{permission.description}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {permission.risk_level === 'HIGH' && (
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                        )}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${getRiskColor(permission.risk_level)}`}>
                          {permission.risk_level}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No permissions assigned</p>
                <p className="text-xs mt-1">Add permissions to this role to grant access</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="scope" className="mt-4 space-y-1">
            <InfoRow 
              label="Tenant ID" 
              value={role.tenant_id} 
              icon={Building}
              copyable
              mono
            />
            <InfoRow 
              label="Scope" 
              value={
                <Badge variant="outline" className="text-xs">
                  Tenant-Scoped
                </Badge>
              } 
              icon={Users}
            />
            <div className="mt-4 p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground">
                This role is scoped to a specific tenant and can only be assigned to users within that tenant.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="audit" className="mt-4 space-y-1">
            <InfoRow 
              label="Created" 
              value={
                <div className="text-right">
                  <div className="text-sm">{getRelativeTime(role.created_at)}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(role.created_at).toLocaleString()}
                  </div>
                </div>
              } 
              icon={Calendar}
            />
            <InfoRow 
              label="Last Updated" 
              value={
                role.updated_at ? (
                  <div className="text-right">
                    <div className="text-sm">{getRelativeTime(role.updated_at)}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(role.updated_at).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">Never modified</span>
                )
              } 
              icon={Clock}
            />
            {role.deleted_at && (
              <InfoRow 
                label="Deleted" 
                value={
                  <div className="text-right">
                    <div className="text-sm text-destructive">{getRelativeTime(role.deleted_at)}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(role.deleted_at).toLocaleString()}
                    </div>
                  </div>
                } 
                icon={X}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
