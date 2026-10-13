import { useEffect, useState } from 'react';
import initialRecords from '../data/sales-data.json';
import type { NewSalesRecord, SalesRecord } from '../types/sales';
import { addRecord, removeRecord } from '../utils/records';
import { loadRecords, saveRecords } from '../utils/recordStorage';

export const useSalesRecords = () => {
  // Lazy initializer: localStorage is read only on the first render, not on every render.
  const [records, setRecords] = useState<SalesRecord[]>(() => loadRecords() ?? initialRecords);

  // Sync React state to an external system (localStorage) whenever records change.
  useEffect(() => {
    saveRecords(records);
  }, [records]);

  const add = (newRecord: NewSalesRecord) => {
    setRecords((current) => addRecord(current, newRecord));
  };

  const remove = (id: number) => {
    setRecords((current) => removeRecord(current, id));
  };

  const reset = () => {
    setRecords(initialRecords);
  };

  return { records, addRecord: add, deleteRecord: remove, resetRecords: reset };
};
