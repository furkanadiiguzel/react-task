import type { SalesSummary } from '../../types/sales';
import { formatCurrency, formatNumber } from '../../utils/format';
import SummaryCard from './SummaryCard';
import styles from './SummaryCards.module.css';

interface SummaryCardsProps {
  summary: SalesSummary;
}

const SummaryCards = ({ summary }: SummaryCardsProps) => (
  <section className={styles.grid} aria-label="Satış özeti">
    <SummaryCard title="Toplam Satış Tutarı" value={formatCurrency(summary.totalRevenue)} />
    <SummaryCard title="Kayıt Sayısı" value={formatNumber(summary.recordCount)} />
    <SummaryCard title="Toplam Satılan Adet" value={formatNumber(summary.totalQuantity)} />
  </section>
);

export default SummaryCards;
