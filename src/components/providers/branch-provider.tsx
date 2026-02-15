'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useQuery } from '@tanstack/react-query';

interface Branch {
  id: string;
  name: string;
  slug: string;
  city?: string;
  isActive: boolean;
}

interface BranchContextValue {
  selectedBranchId: string | null;
  setSelectedBranchId: (branchId: string | null) => void;
  branches: Branch[];
  currentBranch: Branch | null;
  isLoading: boolean;
}

const BranchContext = createContext<BranchContextValue | null>(null);

const STORAGE_KEY = 'rafit-selected-branch';

export function BranchProvider({ children }: { children: ReactNode }) {
  const [selectedBranchId, setSelectedBranchIdState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY);
  });

  const { data, isLoading } = useQuery<{ branches: Branch[] }>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await fetch('/api/branches');
      if (!res.ok) throw new Error('Failed to fetch branches');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes — branches don't change often
  });

  const branches = data?.branches ?? [];

  // Validate that the stored branchId still exists
  useEffect(() => {
    if (!isLoading && selectedBranchId && branches.length > 0) {
      const exists = branches.some((b) => b.id === selectedBranchId);
      if (!exists) {
        setSelectedBranchIdState(null);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [isLoading, selectedBranchId, branches]);

  const setSelectedBranchId = useCallback((branchId: string | null) => {
    setSelectedBranchIdState(branchId);
    if (branchId) {
      localStorage.setItem(STORAGE_KEY, branchId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const currentBranch = selectedBranchId
    ? branches.find((b) => b.id === selectedBranchId) ?? null
    : null;

  return (
    <BranchContext.Provider
      value={{
        selectedBranchId,
        setSelectedBranchId,
        branches,
        currentBranch,
        isLoading,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}
