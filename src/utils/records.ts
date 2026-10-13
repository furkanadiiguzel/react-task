import type { NewSalesRecord, SalesRecord } from '../types/sales';

export const getNextId = (records: SalesRecord[]): number =>
  records.reduce((maxId, record) => Math.max(maxId, record.id), 0) + 1;

export const addRecord = (records: SalesRecord[], newRecord: NewSalesRecord): SalesRecord[] => [
  ...records,
  { id: getNextId(records), ...newRecord },
];

export const removeRecord = (records: SalesRecord[], id: number): SalesRecord[] =>
  records.filter((record) => record.id !== id);
