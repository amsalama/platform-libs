import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Table variants for different visual styles
const tableVariants = cva(
  'w-full caption-bottom text-sm',
  {
    variants: {
      variant: {
        default: '',
        striped: '[&_tbody_tr:nth-child(even)]:bg-muted/30',
        bordered: '[&_td]:border [&_th]:border',
        compact: '[&_td]:py-2 [&_th]:py-2',
      },
      size: {
        sm: '[&_td]:px-2 [&_th]:px-2 text-xs',
        default: '[&_td]:px-4 [&_th]:px-4',
        lg: '[&_td]:px-6 [&_th]:px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

// Table row variants for different states
const tableRowVariants = cva(
  'border-b transition-colors duration-150',
  {
    variants: {
      state: {
        default: 'hover:bg-muted/30',
        selected: 'bg-primary/10 border-l-2 border-l-primary hover:bg-primary/15',
        expanded: 'bg-muted/20',
        clickable: 'cursor-pointer hover:bg-muted/40 active:bg-muted/50',
      },
    },
    defaultVariants: {
      state: 'default',
    },
  }
)

// Table header variants
const tableHeaderVariants = cva(
  'border-b bg-muted/40',
  {
    variants: {
      sticky: {
        true: 'sticky top-0 z-10 shadow-sm',
        false: '',
      },
    },
    defaultVariants: {
      sticky: false,
    },
  }
)

// Table cell variants for pinned columns
const tableCellVariants = cva(
  'align-middle [&:has([role=checkbox])]:pr-0',
  {
    variants: {
      pinned: {
        left: 'sticky left-0 z-20 border-r border-border/50 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.08)]',
        right: 'sticky right-0 z-20 border-l border-border/50 shadow-[-2px_0_8px_-4px_rgba(0,0,0,0.08)]',
        none: '',
      },
    },
    defaultVariants: {
      pinned: 'none',
    },
  }
)

// =============================================================================
// Table Components
// =============================================================================

interface TableProps
  extends React.HTMLAttributes<HTMLTableElement>,
    VariantProps<typeof tableVariants> {}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, variant, size, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn(tableVariants({ variant, size }), className)}
        {...props}
      />
    </div>
  )
)
Table.displayName = 'Table'

// =============================================================================
// Table Header
// =============================================================================

interface TableHeaderProps
  extends React.HTMLAttributes<HTMLTableSectionElement>,
    VariantProps<typeof tableHeaderVariants> {}

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, sticky, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn(tableHeaderVariants({ sticky }), className)}
      {...props}
    />
  )
)
TableHeader.displayName = 'TableHeader'

// =============================================================================
// Table Body
// =============================================================================

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
))
TableBody.displayName = 'TableBody'

// =============================================================================
// Table Footer
// =============================================================================

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
      className
    )}
    {...props}
  />
))
TableFooter.displayName = 'TableFooter'

// =============================================================================
// Table Row
// =============================================================================

interface TableRowProps
  extends React.HTMLAttributes<HTMLTableRowElement>,
    VariantProps<typeof tableRowVariants> {
  'data-state'?: 'selected' | 'expanded'
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, state, ...props }, ref) => {
    // Determine state from data attributes if not explicitly set
    const computedState =
      state ||
      (props['data-state'] === 'selected'
        ? 'selected'
        : props['data-state'] === 'expanded'
        ? 'expanded'
        : 'default')

    return (
      <tr
        ref={ref}
        className={cn(tableRowVariants({ state: computedState }), className)}
        {...props}
      />
    )
  }
)
TableRow.displayName = 'TableRow'

// =============================================================================
// Table Head (Header Cell)
// =============================================================================

interface TableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement>,
    VariantProps<typeof tableCellVariants> {
  sortable?: boolean
  sorted?: 'asc' | 'desc' | false
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, pinned, sortable, sorted, children, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-10 px-3 text-left font-medium text-muted-foreground text-xs',
        sortable && 'cursor-pointer select-none hover:bg-accent/50 hover:text-accent-foreground transition-colors',
        sorted && 'text-foreground bg-accent/30',
        tableCellVariants({ pinned }),
        className
      )}
      aria-sort={
        sorted === 'asc'
          ? 'ascending'
          : sorted === 'desc'
          ? 'descending'
          : undefined
      }
      {...props}
    >
      <div className="flex items-center gap-1.5">
        {children}
        {sorted && (
          <span className="text-primary text-[10px]">
            {sorted === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  )
)
TableHead.displayName = 'TableHead'

// =============================================================================
// Table Cell
// =============================================================================

interface TableCellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement>,
    VariantProps<typeof tableCellVariants> {}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, pinned, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        'px-3 py-2 align-middle text-sm',
        tableCellVariants({ pinned }),
        className
      )}
      {...props}
    />
  )
)
TableCell.displayName = 'TableCell'

// =============================================================================
// Table Caption
// =============================================================================

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-muted-foreground', className)}
    {...props}
  />
))
TableCaption.displayName = 'TableCaption'

// =============================================================================
// Exports
// =============================================================================

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
  tableVariants,
  tableRowVariants,
  tableHeaderVariants,
  tableCellVariants,
}

export type {
  TableProps,
  TableHeaderProps,
  TableRowProps,
  TableHeadProps,
  TableCellProps,
}
