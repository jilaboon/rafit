'use client';

import { Building2, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBranch } from '@/components/providers/branch-provider';
import { cn } from '@/lib/utils';

export function BranchSelector() {
  const { selectedBranchId, setSelectedBranchId, branches, currentBranch, isLoading } =
    useBranch();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>טוען...</span>
      </div>
    );
  }

  // No branches at all — don't render anything
  if (branches.length === 0) {
    return null;
  }

  // Single branch — just show the label, no dropdown
  if (branches.length === 1) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{branches[0].name}</span>
      </div>
    );
  }

  // Multiple branches — show dropdown
  const label = currentBranch ? currentBranch.name : 'כל הסניפים';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Building2 className="h-4 w-4" />
          <span>{label}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setSelectedBranchId(null)}
          className="gap-2"
        >
          <Check
            className={cn(
              'h-4 w-4',
              selectedBranchId === null ? 'opacity-100' : 'opacity-0'
            )}
          />
          כל הסניפים
        </DropdownMenuItem>
        {branches.map((branch) => (
          <DropdownMenuItem
            key={branch.id}
            onClick={() => setSelectedBranchId(branch.id)}
            className="gap-2"
          >
            <Check
              className={cn(
                'h-4 w-4',
                selectedBranchId === branch.id ? 'opacity-100' : 'opacity-0'
              )}
            />
            {branch.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
