import type { ReactNode } from 'react';
import styles from './AddRecordForm.module.css';

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}

const FormField = ({ id, label, error, children }: FormFieldProps) => (
  <div className={styles.field}>
    <label htmlFor={id} className={styles.label}>
      {label}
    </label>
    {children}
    {error && (
      <span id={`${id}-error`} className={styles.error} role="alert">
        {error}
      </span>
    )}
  </div>
);

export default FormField;
