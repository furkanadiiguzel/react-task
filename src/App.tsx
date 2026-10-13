import AddRecordForm from './components/AddRecordForm/AddRecordForm';
import Button from './components/Button/Button';
import EmptyState from './components/EmptyState/EmptyState';
import FilterBar from './components/FilterBar/FilterBar';
import SalesTable from './components/SalesTable/SalesTable';
import SummaryCards from './components/SummaryCards/SummaryCards';
import { useSalesDashboard } from './hooks/useSalesDashboard';
import type { SalesRecord } from './types/sales';
import styles from './App.module.css';

const App = () => {
  const {
    records,
    categories,
    visibleRecords,
    summary,
    search,
    setSearch,
    category,
    setCategory,
    sortOrder,
    setSortOrder,
    addRecord,
    deleteRecord,
    resetRecords,
  } = useSalesDashboard();

  const handleDelete = (record: SalesRecord) => {
    if (window.confirm(`"${record.product}" kaydını silmek istediğinize emin misiniz?`)) {
      deleteRecord(record.id);
    }
  };

  const handleReset = () => {
    if (window.confirm('Tüm değişiklikler silinip başlangıç verileri geri yüklenecek. Emin misiniz?')) {
      resetRecords();
    }
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Satış Paneli</h1>
          <p className={styles.subtitle}>Ürün bazlı satış kayıtlarını inceleyin.</p>
        </div>
        <Button variant="secondary" onClick={handleReset}>
          Verileri sıfırla
        </Button>
      </header>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        categories={categories}
        category={category}
        onCategoryChange={setCategory}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
      />

      <SummaryCards summary={summary} />

      <AddRecordForm records={records} categories={categories} onAdd={addRecord} />

      {visibleRecords.length > 0 ? (
        <SalesTable records={visibleRecords} onDelete={handleDelete} />
      ) : (
        <EmptyState />
      )}
    </main>
  );
};

export default App;
