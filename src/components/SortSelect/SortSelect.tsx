import type { SortOrder } from '../../types/sales';
import styles from './SortSelect.module.css';

interface SortSelectProps {
  value: SortOrder;
  onChange: (value: SortOrder) => void;
}

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'default', label: 'Varsayılan' },
  { value: 'asc', label: 'Fiyat: Artan' },
  { value: 'desc', label: 'Fiyat: Azalan' },
];

const SortSelect = ({ value, onChange }: SortSelectProps) => (
  <label className={styles.field}>
    <span className={styles.label}>Sıralama</span>
    <select
      className={styles.select}
      value={value}
      onChange={(event) => onChange(event.target.value as SortOrder)}
    >
      {SORT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

export default SortSelect;
