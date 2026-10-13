import { ALL_CATEGORIES } from '../../types/sales';
import styles from './CategoryFilter.module.css';

interface CategoryFilterProps {
  categories: string[];
  value: string;
  onChange: (value: string) => void;
}

const CategoryFilter = ({ categories, value, onChange }: CategoryFilterProps) => (
  <label className={styles.field}>
    <span className={styles.label}>Kategori</span>
    <select
      className={styles.select}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value={ALL_CATEGORIES}>Tümü</option>
      {categories.map((category) => (
        <option key={category} value={category}>
          {category}
        </option>
      ))}
    </select>
  </label>
);

export default CategoryFilter;
