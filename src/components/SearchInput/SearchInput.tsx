import styles from './SearchInput.module.css';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

const SearchInput = ({ value, onChange }: SearchInputProps) => (
  <label className={styles.field}>
    <span className={styles.label}>Ürün ara</span>
    <input
      type="search"
      className={styles.input}
      placeholder="Ürün adı yazın..."
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
);

export default SearchInput;
