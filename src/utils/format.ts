const currencyFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('tr-TR');

export const formatCurrency = (value: number): string => currencyFormatter.format(value);

export const formatNumber = (value: number): string => numberFormatter.format(value);
