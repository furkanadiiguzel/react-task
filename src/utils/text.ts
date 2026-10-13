const LOCALE = 'tr-TR';

// Turkish-aware normalization so that "HALI" matches "Halı" and "İ" matches "i".
export const normalizeText = (text: string): string => text.trim().toLocaleLowerCase(LOCALE);
