import styles from './SummaryCards.module.css';

interface SummaryCardProps {
  title: string;
  value: string;
}

const SummaryCard = ({ title, value }: SummaryCardProps) => (
  <article className={styles.card}>
    <h2 className={styles.title}>{title}</h2>
    <p className={styles.value}>{value}</p>
  </article>
);

export default SummaryCard;
