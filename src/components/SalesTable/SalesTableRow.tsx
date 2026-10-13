import type { SalesRecord } from '../../types/sales';
import { formatCurrency, formatNumber } from '../../utils/format';
import { getRecordTotal } from '../../utils/salesFilters';
import styles from './SalesTable.module.css';

interface SalesTableRowProps {
  record: SalesRecord;
}

const SalesTableRow = ({ record }: SalesTableRowProps) => (
  <tr>
    <td>{record.product}</td>
    <td>
      <span className={styles.badge}>{record.category}</span>
    </td>
    <td className={styles.numeric}>{formatCurrency(record.price)}</td>
    <td className={styles.numeric}>{formatNumber(record.quantity)}</td>
    <td className={`${styles.numeric} ${styles.total}`}>
      {formatCurrency(getRecordTotal(record))}
    </td>
  </tr>
);

export default SalesTableRow;
