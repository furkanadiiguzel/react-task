import type { SalesRecord } from '../../types/sales';
import { formatCurrency, formatNumber } from '../../utils/format';
import { getRecordTotal } from '../../utils/salesFilters';
import Button from '../Button/Button';
import styles from './SalesTable.module.css';

interface SalesTableRowProps {
  record: SalesRecord;
  onDelete: (record: SalesRecord) => void;
}

const SalesTableRow = ({ record, onDelete }: SalesTableRowProps) => (
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
    <td className={styles.actions}>
      <Button
        variant="danger"
        size="sm"
        onClick={() => onDelete(record)}
        aria-label={`${record.product} kaydını sil`}
      >
        Sil
      </Button>
    </td>
  </tr>
);

export default SalesTableRow;
