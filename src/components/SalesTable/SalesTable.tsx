import type { SalesRecord } from '../../types/sales';
import SalesTableRow from './SalesTableRow';
import styles from './SalesTable.module.css';

interface SalesTableProps {
  records: SalesRecord[];
  onDelete: (record: SalesRecord) => void;
}

const SalesTable = ({ records, onDelete }: SalesTableProps) => (
  <div className={styles.wrapper}>
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Ürün</th>
          <th>Kategori</th>
          <th className={styles.numeric}>Birim Fiyat</th>
          <th className={styles.numeric}>Adet</th>
          <th className={styles.numeric}>Satış Tutarı</th>
          <th className={styles.actions}>
            <span className={styles.visuallyHidden}>İşlemler</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {records.map((record) => (
          <SalesTableRow key={record.id} record={record} onDelete={onDelete} />
        ))}
      </tbody>
    </table>
  </div>
);

export default SalesTable;
