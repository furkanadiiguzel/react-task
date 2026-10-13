import styles from './EmptyState.module.css';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

const EmptyState = ({
  title = 'Eşleşen kayıt bulunamadı',
  description = 'Arama metnini veya kategori filtresini değiştirmeyi deneyin.',
}: EmptyStateProps) => (
  <div className={styles.empty} role="status">
    <p className={styles.title}>{title}</p>
    <p className={styles.description}>{description}</p>
  </div>
);

export default EmptyState;
