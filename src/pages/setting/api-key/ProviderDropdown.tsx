import type ApiProvider from '@/constants/api-providers'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ProviderDropdownProps {
  availableProviders: ApiProvider[]
  onSelectProvider: (providerId: string) => void
  isLoading: boolean
}

export function ProviderDropdown({
  availableProviders,
  onSelectProvider,
  isLoading,
}: ProviderDropdownProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-muted-foreground text-sm">Popular providers</div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isLoading}>
            Add provider
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          {availableProviders.length > 0 ? (
            availableProviders.map((p) => (
              <DropdownMenuItem key={p.id} onClick={() => onSelectProvider(p.id)}>
                {p.name}
              </DropdownMenuItem>
            ))
          ) : (
            <div className="text-muted-foreground px-2 py-1.5 text-sm">All providers added</div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

