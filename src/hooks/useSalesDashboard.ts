import { useMemo, useState } from 'react';
import { ALL_CATEGORIES, type SortOrder } from '../types/sales';
import {
  calculateSummary,
  filterRecords,
  getCategories,
  sortRecords,
} from '../utils/salesFilters';
import { useSalesRecords } from './useSalesRecords';

export const useSalesDashboard = () => {
  const { records, addRecord, deleteRecord, resetRecords } = useSalesRecords();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [sortOrder, setSortOrder] = useState<SortOrder>('default');

  const categories = useMemo(() => getCategories(records), [records]);

  // If the selected category disappears (its last record was deleted), fall back to "Tümü".
  const activeCategory = categories.includes(category) ? category : ALL_CATEGORIES;

  const filteredRecords = useMemo(
    () => filterRecords(records, { search, category: activeCategory }),
    [records, search, activeCategory],
  );

  // Summary is based on filtered records only; sorting never changes totals.
  const summary = useMemo(() => calculateSummary(filteredRecords), [filteredRecords]);

  const visibleRecords = useMemo(
    () => sortRecords(filteredRecords, sortOrder),
    [filteredRecords, sortOrder],
  );

  return {
    records,
    categories,
    visibleRecords,
    summary,
    search,
    setSearch,
    category: activeCategory,
    setCategory,
    sortOrder,
    setSortOrder,
    addRecord,
    deleteRecord,
    resetRecords,
  };
};
