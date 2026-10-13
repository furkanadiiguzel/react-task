import type { SortOrder } from '../../types/sales';
import CategoryFilter from '../CategoryFilter/CategoryFilter';
import SearchInput from '../SearchInput/SearchInput';
import SortSelect from '../SortSelect/SortSelect';
import styles from './FilterBar.module.css';

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  categories: string[];
  category: string;
  onCategoryChange: (value: string) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (value: SortOrder) => void;
}

const FilterBar = ({
  search,
  onSearchChange,
  categories,
  category,
  onCategoryChange,
  sortOrder,
  onSortOrderChange,
}: FilterBarProps) => (
  <section className={styles.bar} aria-label="Filtreler">
    <SearchInput value={search} onChange={onSearchChange} />
    <CategoryFilter categories={categories} value={category} onChange={onCategoryChange} />
    <SortSelect value={sortOrder} onChange={onSortOrderChange} />
  </section>
);

export default FilterBar;
