import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, 
  Key, 
  Hash,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Clock,
  Shield,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import type { PermissionResponse } from '@/types/role'

interface PermissionViewModalProps {
  permission: PermissionResponse | null
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

export function PermissionViewModal({ permission }: PermissionViewModalProps) {
  if (!permission) return null

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

  const parsePermissionKey = (key: string) => {
    const parts = key.split(':')
    if (parts.length >= 2) {
      return { namespace: parts[0], action: parts.slice(1).join(':') }
    }
    return { namespace: null, action: key }
  }

  const { namespace, action } = parsePermissionKey(permission.permission_key)

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'bg-green-500/10 text-green-600 border-green-500/20'
      case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
      case 'HIGH': return 'bg-red-500/10 text-red-600 border-red-500/20'
      default: return ''
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return CheckCircle2
      case 'DEPRECATED': return AlertTriangle
      case 'DISABLED': return Lock
      default: return Info
    }
  }

  const StatusIcon = getStatusIcon(permission.status)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center ring-2 ring-amber-500/10">
          <Key className="h-8 w-8 text-amber-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold font-mono flex items-center gap-2">
            {namespace && (
              <>
                <span className="text-primary">{namespace}</span>
                <span className="text-muted-foreground">:</span>
              </>
            )}
            <span>{action}</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {permission.description || 'No description provided'}
          </p>
        </div>
      </div>
      
      <div>
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-9">
            <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
            <TabsTrigger value="security" className="text-xs">Security</TabsTrigger>
            <TabsTrigger value="audit" className="text-xs">Audit</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-4 space-y-1">
            <InfoRow 
              label="Permission ID" 
              value={permission.id} 
              icon={Hash}
              copyable
              mono
            />
            <InfoRow 
              label="Permission Key" 
              value={permission.permission_key} 
              icon={Key}
              copyable
              mono
            />
            {namespace && (
              <InfoRow 
                label="Namespace" 
                value={
                  <Badge variant="outline" className="text-xs font-mono">
                    {namespace}
                  </Badge>
                } 
                icon={Shield}
              />
            )}
            <InfoRow 
              label="Action" 
              value={action} 
              icon={Info}
            />
          </TabsContent>
          
          <TabsContent value="security" className="mt-4 space-y-1">
            <InfoRow 
              label="Status" 
              value={
                <div className="flex items-center gap-1.5">
                  <StatusIcon className="h-3.5 w-3.5" />
                  <Badge 
                    variant={permission.status === 'ACTIVE' ? 'default' : permission.status === 'DEPRECATED' ? 'secondary' : 'destructive'} 
                    className="text-xs"
                  >
                    {permission.status}
                  </Badge>
                </div>
              } 
              icon={CheckCircle2}
            />
            <InfoRow 
              label="Risk Level" 
              value={
                <span className={`text-xs px-2 py-0.5 rounded border font-medium ${getRiskColor(permission.risk_level)}`}>
                  {permission.risk_level}
                </span>
              } 
              icon={AlertTriangle}
            />
            <InfoRow 
              label="Type" 
              value={
                <Badge variant={permission.is_system ? 'secondary' : 'outline'} className="text-xs">
                  {permission.is_system ? 'System' : 'Custom'}
                </Badge>
              } 
              icon={permission.is_system ? Lock : Key}
            />
            <InfoRow 
              label="Assignable" 
              value={
                permission.is_assignable ? (
                  <div className="flex items-center gap-1.5 text-green-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="text-sm">Yes</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Lock className="h-3.5 w-3.5" />
                    <span className="text-sm">No</span>
                  </div>
                )
              } 
              icon={Shield}
            />
            
            {permission.risk_level === 'HIGH' && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-red-600">High Risk Permission</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This permission grants elevated privileges. Assign with caution and ensure proper authorization.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="audit" className="mt-4 space-y-1">
            <InfoRow 
              label="Created" 
              value={
                <div className="text-right">
                  <div className="text-sm">{getRelativeTime(permission.created_at)}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(permission.created_at).toLocaleString()}
                  </div>
                </div>
              } 
              icon={Calendar}
            />
            <InfoRow 
              label="Last Updated" 
              value={
                permission.updated_at ? (
                  <div className="text-right">
                    <div className="text-sm">{getRelativeTime(permission.updated_at)}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(permission.updated_at).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">Never modified</span>
                )
              } 
              icon={Clock}
            />
            {permission.introduced_in_version && (
              <InfoRow 
                label="Introduced In" 
                value={
                  <Badge variant="outline" className="text-xs font-mono">
                    v{permission.introduced_in_version}
                  </Badge>
                } 
                icon={Info}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}