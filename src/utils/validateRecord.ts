import type {
  NewSalesRecord,
  RecordFormErrors,
  RecordFormValues,
  SalesRecord,
} from '../types/sales';
import { normalizeText } from './text';

export const MAX_PRODUCT_LENGTH = 50;

export const EMPTY_FORM_VALUES: RecordFormValues = {
  product: '',
  category: '',
  price: '',
  quantity: '',
};

const isDuplicate = (values: RecordFormValues, records: SalesRecord[]): boolean => {
  const product = normalizeText(values.product);
  const category = normalizeText(values.category);
  return records.some(
    (record) =>
      normalizeText(record.product) === product && normalizeText(record.category) === category,
  );
};

const validateProduct = (values: RecordFormValues, records: SalesRecord[]): string | undefined => {
  const product = values.product.trim();
  if (product === '') return 'Ürün adı zorunludur.';
  if (product.length > MAX_PRODUCT_LENGTH)
    return `Ürün adı en fazla ${MAX_PRODUCT_LENGTH} karakter olabilir.`;
  if (isDuplicate(values, records)) return 'Bu kategoride aynı isimde bir ürün zaten var.';
  return undefined;
};

const validateCategory = (category: string): string | undefined =>
  category.trim() === '' ? 'Kategori zorunludur.' : undefined;

const validatePrice = (price: string): string | undefined => {
  if (price.trim() === '') return 'Birim fiyat zorunludur.';
  const value = Number(price);
  if (!Number.isFinite(value) || value <= 0) return 'Birim fiyat 0’dan büyük olmalıdır.';
  return undefined;
};

const validateQuantity = (quantity: string): string | undefined => {
  if (quantity.trim() === '') return 'Adet zorunludur.';
  const value = Number(quantity);
  if (!Number.isInteger(value) || value < 1) return 'Adet en az 1 olan bir tam sayı olmalıdır.';
  return undefined;
};

export const validateRecord = (
  values: RecordFormValues,
  records: SalesRecord[],
): RecordFormErrors => {
  const errors: RecordFormErrors = {
    product: validateProduct(values, records),
    category: validateCategory(values.category),
    price: validatePrice(values.price),
    quantity: validateQuantity(values.quantity),
  };

  // Drop fields without an error so an empty object means "valid".
  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => message !== undefined),
  ) as RecordFormErrors;
};

export const hasErrors = (errors: RecordFormErrors): boolean => Object.keys(errors).length > 0;

// Reuses the existing spelling when the typed category matches one case-insensitively,
// so "elektronik" does not create a second "Elektronik" category.
const resolveCategory = (input: string, categories: string[]): string => {
  const category = input.trim();
  return categories.find((existing) => normalizeText(existing) === normalizeText(category)) ?? category;
};

export const toNewRecord = (values: RecordFormValues, categories: string[]): NewSalesRecord => ({
  product: values.product.trim(),
  category: resolveCategory(values.category, categories),
  price: Number(values.price),
  quantity: Number(values.quantity),
});
