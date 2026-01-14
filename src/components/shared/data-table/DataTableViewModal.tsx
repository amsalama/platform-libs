import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface DataTableViewModalProps<TData> {
  /**
   * Whether the modal is open
   */
  open: boolean
  /**
   * Callback when open state changes
   */
  onOpenChange: (open: boolean) => void
  /**
   * Row data to display
   */
  data: TData | null
  /**
   * Render function for modal content
   */
  renderContent: (data: TData, onClose: () => void) => React.ReactNode
  /**
   * Modal title
   */
  title?: string
  /**
   * Modal description
   */
  description?: string
  /**
   * Maximum width of the modal
   * @default 'max-w-2xl'
   */
  maxWidth?: string
  /**
   * Additional CSS classes for the modal content
   */
  className?: string
}

/**
 * View modal component for DataTable
 *
 * Uses proper Dialog component with animations and focus management
 *
 * @example
 * ```tsx
 * const [viewModal, setViewModal] = useState<{ open: boolean; row?: User }>({ open: false })
 *
 * <DataTableViewModal
 *   open={viewModal.open}
 *   onOpenChange={(open) => setViewModal({ open, row: open ? viewModal.row : undefined })}
 *   data={viewModal.row}
 *   title="User Details"
 *   renderContent={(user, onClose) => (
 *     <UserDetails user={user} onClose={onClose} />
 *   )}
 * />
 * ```
 */
export function DataTableViewModal<TData>({
  open,
  onOpenChange,
  data,
  renderContent,
  title,
  description,
  maxWidth = 'max-w-2xl',
  className,
}: DataTableViewModalProps<TData>) {
  const handleClose = () => onOpenChange(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(maxWidth, 'max-h-[90vh] overflow-y-auto', className)}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {data && renderContent(data, handleClose)}
      </DialogContent>
    </Dialog>
  )
}

export type { DataTableViewModalProps }
