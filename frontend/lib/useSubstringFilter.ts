import { useMemo } from 'react';
export function useSubstringFilter<T>(items: T[], query: string, projector: (item: T) => string): T[] {
  return useMemo(() => { const n = query.trim().toLowerCase(); if (!n) return items; return items.filter((item) => projector(item).toLowerCase().includes(n)); }, [items, projector, query]);
}
