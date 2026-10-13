import EmptyState from './components/EmptyState/EmptyState';
import FilterBar from './components/FilterBar/FilterBar';
import SalesTable from './components/SalesTable/SalesTable';
import SummaryCards from './components/SummaryCards/SummaryCards';
import { useSalesDashboard } from './hooks/useSalesDashboard';
import styles from './App.module.css';

const App = () => {
  const {
    categories,
    visibleRecords,
    summary,
    search,
    setSearch,
    category,
    setCategory,
    sortOrder,
    setSortOrder,
  } = useSalesDashboard();

  return (
    <main className={styles.container}>
      <header>
        <h1 className={styles.title}>Satış Paneli</h1>
        <p className={styles.subtitle}>Ürün bazlı satış kayıtlarını inceleyin.</p>
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

      {visibleRecords.length > 0 ? <SalesTable records={visibleRecords} /> : <EmptyState />}
    </main>
  );
};

export default App;
