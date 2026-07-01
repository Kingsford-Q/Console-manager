import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface FilterOption {
  value: string
  label: string
}

interface PageToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filterValue?: string
  onFilterChange?: (value: string) => void
  filterOptions?: FilterOption[]
  filterPlaceholder?: string
  onAdd?: () => void
  addLabel?: string
}

export function PageToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filterValue,
  onFilterChange,
  filterOptions,
  filterPlaceholder = 'All statuses',
  onAdd,
  addLabel = 'Add New',
}: PageToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        {filterOptions && onFilterChange && (
          <Select value={filterValue ?? 'all'} onValueChange={onFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={filterPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{filterPlaceholder}</SelectItem>
              {filterOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {onAdd && (
        <Button onClick={onAdd} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          {addLabel}
        </Button>
      )}
    </div>
  )
}
