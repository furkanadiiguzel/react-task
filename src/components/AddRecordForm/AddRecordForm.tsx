import { useState, type ChangeEvent, type FormEvent } from 'react';
import type {
  NewSalesRecord,
  RecordFormErrors,
  RecordFormValues,
  SalesRecord,
} from '../../types/sales';
import {
  EMPTY_FORM_VALUES,
  MAX_PRODUCT_LENGTH,
  hasErrors,
  toNewRecord,
  validateRecord,
} from '../../utils/validateRecord';
import Button from '../Button/Button';
import FormField from './FormField';
import styles from './AddRecordForm.module.css';

interface AddRecordFormProps {
  records: SalesRecord[];
  categories: string[];
  onAdd: (record: NewSalesRecord) => void;
}

const CATEGORY_LIST_ID = 'category-options';

const AddRecordForm = ({ records, categories, onAdd }: AddRecordFormProps) => {
  const [values, setValues] = useState<RecordFormValues>(EMPTY_FORM_VALUES);
  const [errors, setErrors] = useState<RecordFormErrors>({});

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    // Clear the error of the field being edited so the message doesn't linger while typing.
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateRecord(values, records);
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    onAdd(toNewRecord(values, categories));
    setValues(EMPTY_FORM_VALUES);
    setErrors({});
  };

  const inputProps = (name: keyof RecordFormValues) => ({
    id: `record-${name}`,
    name,
    value: values[name],
    onChange: handleChange,
    className: `${styles.input} ${errors[name] ? styles.inputInvalid : ''}`.trim(),
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `record-${name}-error` : undefined,
  });

  return (
    <section className={styles.card} aria-labelledby="add-record-title">
      <h2 id="add-record-title" className={styles.title}>
        Yeni Kayıt Ekle
      </h2>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <FormField id="record-product" label="Ürün adı" error={errors.product}>
          <input
            {...inputProps('product')}
            type="text"
            placeholder="ör. Tablet"
            maxLength={MAX_PRODUCT_LENGTH}
          />
        </FormField>

        <FormField id="record-category" label="Kategori" error={errors.category}>
          <input
            {...inputProps('category')}
            type="text"
            placeholder="Seçin veya yeni yazın"
            list={CATEGORY_LIST_ID}
          />
          <datalist id={CATEGORY_LIST_ID}>
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </FormField>

        <FormField id="record-price" label="Birim fiyat (TL)" error={errors.price}>
          <input {...inputProps('price')} type="number" min="0" step="any" placeholder="0" />
        </FormField>

        <FormField id="record-quantity" label="Adet" error={errors.quantity}>
          <input {...inputProps('quantity')} type="number" min="1" step="1" placeholder="1" />
        </FormField>

        <div className={styles.actions}>
          <Button type="submit">Ekle</Button>
        </div>
      </form>
    </section>
  );
};

export default AddRecordForm;
