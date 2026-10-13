# Mini Satış Paneli

Ürün bazlı satış kayıtlarını **listeleyen, arayan, kategoriye göre filtreleyen, fiyata göre sıralayan** ve görüntülenen kayıtlar için **satış özeti** gösteren küçük bir React dashboard'u.

> Bu doküman; projede **hangi tekniği nerede ve neden** kullandığımızı, **bilerek kullanmadığımız** şeyleri (ör. `useEffect`, debounce) ve alınan kararları ayrıntılı olarak açıklar.

---

## İçindekiler

1. [Çalıştırma](#1-çalıştırma)
2. [Teknoloji seçimi](#2-teknoloji-seçimi)
3. [Klasör yapısı](#3-klasör-yapısı)
4. [Mimari ve veri akışı](#4-mimari-ve-veri-akışı)
5. [Katman katman teknik açıklama](#5-katman-katman-teknik-açıklama)
6. [React kavramları: nerede, nasıl kullanıldı?](#6-react-kavramları-nerede-nasıl-kullanıldı)
7. [Bilerek kullanılmayanlar ve nedenleri](#7-bilerek-kullanılmayanlar-ve-nedenleri)
8. [Gereksinim → kod eşlemesi](#8-gereksinim--kod-eşlemesi)
9. [Kenar durumlar (edge case'ler)](#9-kenar-durumlar-edge-caseler)
10. [Stil yaklaşımı](#10-stil-yaklaşımı)
11. [Yapılandırma değişiklikleri](#11-yapılandırma-değişiklikleri)
12. [Doğrulama](#12-doğrulama)
13. [Karşılaşılan sorunlar](#13-karşılaşılan-sorunlar)
14. [Bonuslar için yol haritası](#14-bonuslar-için-yol-haritası)

---

## 1. Çalıştırma

```bash
npm install      # bağımlılıkları kur
npm run dev      # geliştirme sunucusu → http://localhost:5173
npm run build    # tip kontrolü (tsc -b) + production build
npm run lint     # oxlint ile statik analiz
```

---

## 2. Teknoloji seçimi

| Teknoloji | Neden? |
|---|---|
| **React 19** (functional component + hooks) | Görev gereksinimi. Class component kullanılmadı. |
| **TypeScript** | `SalesRecord` gibi veri modellerinin tiplenmesi; yanlış prop geçildiğinde derleme anında hata alınır. |
| **Vite** | Hızlı kurulum ve anlık HMR (kaydettiğin anda tarayıcı güncellenir). |
| **CSS Modules** | Ek bağımlılık yok; class isimleri bileşene özel (scoped) olduğu için çakışma olmaz. |
| **UI kütüphanesi yok** | Bileşenlerin tamamı elle yazıldı; böylece component tasarımı ve state yönetimi doğrudan görülebiliyor. |

---

## 3. Klasör yapısı

```
src/
├── data/
│   └── sales-data.json             # Başlangıç verisi (10 kayıt)
├── types/
│   └── sales.ts                    # SalesRecord, SortOrder, SalesFilters, SalesSummary, ALL_CATEGORIES
├── utils/
│   ├── format.ts                   # formatCurrency, formatNumber (Intl.NumberFormat)
│   └── salesFilters.ts             # filterRecords, sortRecords, calculateSummary, getCategories, getRecordTotal
├── hooks/
│   └── useSalesDashboard.ts        # Tüm state + türetilmiş veriler (useState + useMemo)
├── components/
│   ├── FilterBar/                  # SearchInput + CategoryFilter + SortSelect'i bir araya getirir
│   ├── SearchInput/                # Kontrollü arama input'u
│   ├── CategoryFilter/             # "Tümü" + veriden gelen kategoriler
│   ├── SortSelect/                 # Varsayılan / Artan / Azalan
│   ├── SummaryCards/               # SummaryCards (liste) + SummaryCard (tek kart)
│   ├── SalesTable/                 # SalesTable (tablo) + SalesTableRow (tek satır)
│   └── EmptyState/                 # Sonuç yoksa gösterilen mesaj
├── App.tsx                         # Sayfa düzeni; hook'u çağırır, bileşenlere prop dağıtır
├── App.module.css
├── index.css                       # CSS değişkenleri (renk, radius) + temel reset
└── main.tsx                        # React'i DOM'a bağlar (StrictMode)
```

**Her bileşen kendi klasöründe**, `.tsx` ve `.module.css` dosyasıyla birlikte durur. Bir bileşeni silmek ya da taşımak için tek bir klasörle uğraşmak yeterli olur.

---

## 4. Mimari ve veri akışı

Proje üç katmana ayrıldı. Her katmanın tek bir sorumluluğu var (**Single Responsibility**):

```
┌──────────────────────────────────────────────────────────────┐
│ utils/        SAF FONKSİYONLAR  (React'ten bağımsız)          │
│               filterRecords · sortRecords · calculateSummary │
└───────────────────────────▲──────────────────────────────────┘
                            │ çağırır
┌───────────────────────────┴──────────────────────────────────┐
│ hooks/        useSalesDashboard  (STATE + TÜRETİLMİŞ VERİ)    │
│               useState × 4  ·  useMemo × 4                   │
└───────────────────────────▲──────────────────────────────────┘
                            │ döndürdüğü değerleri kullanır
┌───────────────────────────┴──────────────────────────────────┐
│ App.tsx  →  components/   SADECE GÖRÜNTÜLEME (presentational) │
│             props alır, callback çağırır, state tutmaz       │
└──────────────────────────────────────────────────────────────┘
```

### Bir kullanıcı etkileşiminin yolculuğu

Örnek: kullanıcı arama kutusuna `"lap"` yazıyor.

```
1. <input> onChange              → SearchInput, onChange("lap") çağırır
2. FilterBar                     → onSearchChange prop'u = setSearch
3. useSalesDashboard             → search state'i "lap" olur → yeniden render
4. useMemo(filteredRecords)      → [search] değiştiği için yeniden hesaplanır
                                    filterRecords(records, { search: "lap", category })
5. useMemo(summary)              → filteredRecords değiştiği için yeniden hesaplanır
6. useMemo(visibleRecords)       → filteredRecords değiştiği için yeniden sıralanır
7. App                           → visibleRecords.length > 0 ? <SalesTable/> : <EmptyState/>
```

### Kritik sıra: **filtrele → özetle → sırala**

```
records ──filter──► filteredRecords ──┬──► calculateSummary ──► summary
                                      └──► sortRecords ───────► visibleRecords
```

Özet, **sıralamadan önceki** listeden hesaplanır. Sıralama özet hesabına hiç girmediği için toplamları değiştirmesi **mümkün değildir**. Bu, şartnamedeki "sıralama toplamları değiştirmez" kuralını yapı gereği garanti eder.

---

## 5. Katman katman teknik açıklama

### 5.1 `types/sales.ts`: Veri modeli

```ts
export interface SalesRecord { id: number; product: string; category: string; price: number; quantity: number; }
export type SortOrder = 'default' | 'asc' | 'desc';
export interface SalesFilters { search: string; category: string; }
export interface SalesSummary { totalRevenue: number; recordCount: number; totalQuantity: number; }
export const ALL_CATEGORIES = 'all';
```

- **`SortOrder` bir union type.** Yalnızca bu üç değeri kabul eder; `'ascending'` gibi bir yazım hatası derleme hatası verir.
- **`ALL_CATEGORIES` sabiti.** `'all'` string'i kodun birden fazla yerinde kullanıldığı için "magic string" yerine tek bir sabitte tutuldu.
- **Neden `'all'`, neden `'Tümü'` değil?** `'Tümü'` ekranda gösterilen etikettir, `'all'` ise iç değerdir. Etiket değişse bile mantık bozulmaz.

### 5.2 `utils/salesFilters.ts`: İş mantığı (saf fonksiyonlar)

Bu dosyadaki tüm fonksiyonlar **saf (pure)** fonksiyonlardır:
- Aynı girdi için her zaman aynı çıktıyı verirler.
- Dışarıdaki hiçbir şeyi değiştirmezler.
- React'i hiç bilmezler.

Bu sayede ayrı ayrı test edilebilirler ve tarayıcı olmadan da çalıştırılabilirler.

#### `normalize(text)`

```ts
const normalize = (text: string): string => text.trim().toLocaleLowerCase('tr-TR');
```

- **`trim()`:** Baştaki ve sondaki boşlukları siler. `"  lap "` girişi `"lap"` gibi davranır.
- **`toLocaleLowerCase('tr-TR')`:** Büyük/küçük harf duyarsızlığını sağlar. Neden düz `toLowerCase()` değil, bkz. [Bölüm 9](#9-kenar-durumlar-edge-caseler).

#### `getRecordTotal(record)`

```ts
export const getRecordTotal = (record: SalesRecord): number => record.price * record.quantity;
```

"Satış tutarı = fiyat × adet" kuralı **tek bir yerde** tanımlıdır. Hem tablo satırı (`SalesTableRow`) hem de özet (`calculateSummary`) bu fonksiyonu kullanır (DRY prensibi).

#### `getCategories(records)`

```ts
Array.from(new Set(records.map((record) => record.category)));
```

- **`Set`** tekrar eden değerleri otomatik eler.
- Sonuç `['Elektronik', 'Mobilya', 'Dekorasyon']` olur ve veride ilk görülme sırası korunur.
- Kategoriler **koda gömülü değildir**, veriden türetilir. Yeni kategoride bir ürün eklenirse dropdown kendiliğinden güncellenir. Bu, bonus "ürün ekleme" için önemlidir.

#### `filterRecords(records, { search, category })`

```ts
const query = normalize(search);
return records.filter((record) => {
  const matchesSearch   = query === '' || normalize(record.product).includes(query);
  const matchesCategory = category === ALL_CATEGORIES || record.category === category;
  return matchesSearch && matchesCategory;
});
```

- **İki koşul `&&` ile birleşir.** Arama ve kategori aynı anda uygulanır (gereksinim 6).
- **`query === ''`:** Arama kutusu boşsa ürün adı kısıtı kalkar, kategori kısıtı ise aynen kalır.
- **`category === ALL_CATEGORIES`:** "Tümü" seçiliyse kategori kısıtı kalkar, arama metni ise aynen kalır.
- **`includes`:** Ürün adının **içinde geçen** her metni eşleştirir. `"lap"` → `Laptop` bulunur, `"top"` → yine `Laptop` bulunur.
- **`query` döngünün dışında bir kez hesaplanır.** Her kayıt için tekrar normalize edilmez.

#### `sortRecords(records, order)`

```ts
if (order === 'default') return records;
const direction = order === 'asc' ? 1 : -1;
return [...records].sort((a, b) => (a.price - b.price) * direction);
```

- **`[...records]` kopyası alınır.** `Array.prototype.sort` diziyi **yerinde değiştirir** (mutation). Kopya alınmasaydı:
  - State'teki orijinal dizi bozulurdu.
  - "Varsayılan" sıraya bir daha dönülemezdi.
  - React'in "state'i doğrudan değiştirme" kuralı çiğnenmiş olurdu.
- **`'default'` için orijinal dizi döndürülür.** Filtreleme kaynak sırayı koruduğu için bu, şartnamedeki "varsayılan sıralama = kaynak verideki sıra" demektir. Ayrıca gereksiz kopya oluşturulmaz.
- **`direction` çarpanı:** Artan ve azalan için ayrı iki karşılaştırma fonksiyonu yazmak yerine sonuç `1` veya `-1` ile çarpılır.
- **Eşit fiyatlar:** ES2019'dan beri `sort` **kararlıdır (stable)**, yani eşit fiyatlı kayıtlar kendi aralarındaki orijinal sırayı korur. Şartname bunu zorunlu tutmuyor, ama davranış öngörülebilir.

#### `calculateSummary(records)`

```ts
records.reduce<SalesSummary>(
  (summary, record) => ({
    totalRevenue:  summary.totalRevenue + getRecordTotal(record),
    recordCount:   summary.recordCount + 1,
    totalQuantity: summary.totalQuantity + record.quantity,
  }),
  { totalRevenue: 0, recordCount: 0, totalQuantity: 0 },
);
```

- **Tek bir `reduce` ile üç değer birden hesaplanır.** Liste yalnızca bir kez dolaşılır.
- **Başlangıç değeri `{0, 0, 0}`.** Liste boşsa `reduce` bu değeri olduğu gibi döndürür. "Sonuç yoksa özetler 0 gösterilir" kuralı ek bir `if` gerekmeden sağlanır.
- **`reduce<SalesSummary>`:** Generic tip parametresi accumulator'ın tipini sabitler.

### 5.3 `utils/format.ts`: Para ve sayı formatı

```ts
const currencyFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency', currency: 'TRY', maximumFractionDigits: 0,
});
export const formatCurrency = (value: number) => currencyFormatter.format(value);
```

- **Tarayıcının yerleşik `Intl` API'si kullanıldı**, ek kütüphane yok. `98900` → `₺98.900` olur: binlik ayırıcı nokta, TL simgesi.
- **Formatter modül seviyesinde bir kez oluşturulur.** `Intl.NumberFormat` oluşturmak görece maliyetlidir. Her render'da ve her hücre için yeniden yaratılmaz.
- **`maximumFractionDigits: 0`:** Verideki fiyatlar tam sayı, kuruş göstermeye gerek yok.
- **`formatNumber`:** Adet ve kayıt sayısı için aynı yaklaşım (ör. `1.250`).

### 5.4 `hooks/useSalesDashboard.ts`: State yönetimi (custom hook)

```ts
export const useSalesDashboard = () => {
  const [records] = useState<SalesRecord[]>(initialRecords);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [sortOrder, setSortOrder] = useState<SortOrder>('default');

  const categories      = useMemo(() => getCategories(records), [records]);
  const filteredRecords = useMemo(() => filterRecords(records, { search, category }), [records, search, category]);
  const summary         = useMemo(() => calculateSummary(filteredRecords), [filteredRecords]);
  const visibleRecords  = useMemo(() => sortRecords(filteredRecords, sortOrder), [filteredRecords, sortOrder]);

  return { categories, visibleRecords, summary, search, setSearch, category, setCategory, sortOrder, setSortOrder };
};
```

**Neden custom hook?**
- `App.tsx` yalnızca **sayfa düzeniyle** ilgilenir. Tüm state mantığı tek bir yerde toplanır.
- `App` hook'tan yalnızca "neyi göstereceğini" alır, "nasıl hesaplandığını" bilmez.
- İleride state mantığı değişirse (ör. `useReducer` veya localStorage) `App` ve bileşenler etkilenmez.

**Neden yalnızca 4 state var? (minimal state ilkesi)**

Sadece **kullanıcının doğrudan değiştirdiği** değerler state'te tutulur: `records`, `search`, `category`, `sortOrder`. `filteredRecords`, `summary`, `visibleRecords` ve `categories` state **değildir**, her render'da bu dört değerden **türetilir**.

Örneğin `summary` ayrı bir state olsaydı, her filtre değişiminde onu da elle güncellemek gerekirdi. Birini unutmak, ekrandaki tablo ile özetin **senkronizasyonunun bozulması** demektir. Türetilmiş veri bu hata sınıfını tamamen ortadan kaldırır.

**`const [records] = useState(initialRecords)`, neden setter yok?**
- Zorunlu gereksinimlerde kayıtlar değişmiyor, bu yüzden setter şimdilik alınmadı (kullanılmayan değişken lint hatası verirdi).
- Ama veri bilerek **sabit bir değişken yerine state içinde** tutuldu. Bonus aşamasında ekleme ve silme için yalnızca `setRecords` eklemek yeterli olacak, yapı değişmeyecek.

**`useMemo` neden ve nasıl?**

`useMemo(fn, deps)`, `fn`'in sonucunu saklar ve yalnızca `deps` dizisindeki değerlerden biri değiştiğinde yeniden hesaplar.

| Değer | Bağımlılıklar | Ne zaman yeniden hesaplanır? |
|---|---|---|
| `categories` | `[records]` | Yalnızca kayıt listesi değişince. Arama yazarken **hesaplanmaz**. |
| `filteredRecords` | `[records, search, category]` | Arama veya kategori değişince. **Sıralama değişince hesaplanmaz.** |
| `summary` | `[filteredRecords]` | Yalnızca filtre sonucu değişince. **Sıralama değişince hesaplanmaz.** |
| `visibleRecords` | `[filteredRecords, sortOrder]` | Filtre sonucu veya sıralama değişince. |

> **Dürüst not:** 10 kayıtlık bir veride `useMemo` olmadan da performans farkı hissedilmez. Burada kullanılmasının asıl nedenleri şunlar:
> 1. Bağımlılık dizileri **hangi verinin neye bağlı olduğunu** okunur şekilde belgeliyor.
> 2. Sıralama değiştiğinde `summary` objesinin referansı aynı kalıyor. Bu da "sıralama özeti etkilemez" ilişkisini kodda görünür kılıyor.
> 3. Veri büyüdüğünde ölçeklenebilir.

### 5.5 `components/`: Sunum bileşenleri

Tüm bileşenler **presentational (sunum) bileşenidir**:
- Kendi state'leri yoktur.
- Veriyi **props** ile alırlar, kullanıcı aksiyonunu **callback prop** ile yukarı bildirirler.
- Her bileşenin props'u bir TypeScript `interface`'i ile tanımlıdır.

| Bileşen | Props | Sorumluluk |
|---|---|---|
| `SearchInput` | `value`, `onChange(value)` | Kontrollü `<input type="search">`. |
| `CategoryFilter` | `categories`, `value`, `onChange(value)` | "Tümü" (`ALL_CATEGORIES`) + veriden gelen kategoriler. |
| `SortSelect` | `value: SortOrder`, `onChange(SortOrder)` | Seçenekler bir `SORT_OPTIONS` dizisinden `map` ile üretilir. |
| `FilterBar` | 7 prop (yukarıdaki üçünün toplamı) | **Composition:** üç kontrolü bir araya getirir, prop'ları dağıtır. |
| `SummaryCards` | `summary` | Üç `SummaryCard` render eder, değerleri formatlar. |
| `SummaryCard` | `title`, `value` | Tek, yeniden kullanılabilir kart. |
| `SalesTable` | `records` | Tablo başlığı + satırlar. |
| `SalesTableRow` | `record` | Tek satır; tutarı `getRecordTotal` ile hesaplar. |
| `EmptyState` | `title?`, `description?` | Varsayılan mesajlı, özelleştirilebilir boş durum. |

**`SortSelect` içindeki tip dönüşümü:**

```ts
onChange={(event) => onChange(event.target.value as SortOrder)}
```

`<select>`'in değeri DOM'dan her zaman `string` gelir. Seçenekler yalnızca `SORT_OPTIONS`'tan üretildiği için değerin bir `SortOrder` olduğu garanti edilir. `as` burada güvenlidir.

---

## 6. React kavramları: nerede, nasıl kullanıldı?

| Kavram | Nerede? | Nasıl / Neden? |
|---|---|---|
| **`useState`** | `useSalesDashboard.ts` | 4 adet: `records`, `search`, `category`, `sortOrder`. Yalnızca kullanıcının değiştirdiği ham değerler. |
| **`useMemo`** | `useSalesDashboard.ts` | 4 adet: türetilmiş veriler. Bkz. [5.4](#54-hookssalesdashboardts-state-yönetimi-custom-hook). |
| **Custom hook** | `useSalesDashboard` | State + iş mantığını UI'dan ayırır. `use` önekiyle başladığı için React kurallarına tabidir. |
| **Controlled components** | `SearchInput`, `CategoryFilter`, `SortSelect` | Input'un değeri (`value`) her zaman React state'inden gelir, `onChange` ile güncellenir. DOM ile state hiçbir zaman ayrışmaz. |
| **Lifting state up** | `search`/`category`/`sortOrder` hook'ta | Bu state'ler hem filtre kontrollerini hem tabloyu hem özeti etkilediği için **ortak üst noktada** tutulur. |
| **Props + callback props** | Tüm bileşenler | Veri aşağı (props), olaylar yukarı (`onChange`) akar: **tek yönlü veri akışı**. |
| **Composition** | `FilterBar`, `SummaryCards`, `SalesTable` | Küçük bileşenler birleştirilerek büyükleri oluşturulur. |
| **Liste render + `key`** | `SalesTable`, `CategoryFilter`, `SortSelect` | `key={record.id}`: benzersiz ve kalıcı id. **Index kullanılmadı**, çünkü sıralama ve silmede index değişir ve React yanlış satırı günceller. |
| **Koşullu render** | `App.tsx` | `visibleRecords.length > 0 ? <SalesTable/> : <EmptyState/>` |
| **Varsayılan prop değerleri** | `EmptyState` | Destructuring default'ları: `title = 'Eşleşen kayıt bulunamadı'`. |
| **`StrictMode`** | `main.tsx` | Geliştirme sırasında yan etki hatalarını yakalamak için bileşenleri iki kez render eder. |
| **JSON import** | `useSalesDashboard.ts` | `import initialRecords from '../data/sales-data.json'`. Vite derleme anında JS'e çevirir, `fetch` gerekmez. |

---

## 7. Bilerek kullanılmayanlar ve nedenleri

Görüşmede sorulması muhtemel olduğu için ayrıca belirtildi.

### `useEffect`: **kullanılmadı**

`useEffect` **React dışındaki sistemlerle senkronizasyon** içindir: localStorage, API isteği, `document.title`, event listener, timer gibi. Bu projede (zorunlu kısımda) dış sistem yok.

Sık yapılan bir hata, filtrelenmiş listeyi `useEffect` ile hesaplayıp state'e yazmaktır:

```ts
// ❌ YANLIŞ: gereksiz effect + gereksiz state + ekstra render
const [filtered, setFiltered] = useState(records);
useEffect(() => {
  setFiltered(filterRecords(records, { search, category }));
}, [records, search, category]);
```

Bu yaklaşımın sorunları:
1. **Ekstra render:** Önce eski `filtered` ile render olur, sonra effect çalışır, `setFiltered` tetiklenir ve ikinci bir render olur.
2. **Bir anlığına tutarsız ekran:** Arama değişmiş ama tablo hâlâ eski liste olabilir.
3. **Gereksiz state:** Senkron tutulması gereken ikinci bir kaynak oluşur.

```ts
// ✅ DOĞRU: render sırasında türet
const filteredRecords = useMemo(() => filterRecords(records, { search, category }), [records, search, category]);
```

React dokümantasyonu da bunu önerir: *"You Might Not Need an Effect"*. `useEffect` **bonus aşamada localStorage'a yazmak için** kullanılacak. Orası gerçekten bir dış sistemle senkronizasyondur.

### Debounce: **kullanılmadı**

Debounce, kullanıcı yazmayı bıraktıktan **belirli bir süre sonra** işlemi tetikler (ör. 300 ms). Ağırlıklı olarak **pahalı işlemler** için kullanılır: API isteği, binlerce kaydı filtreleme gibi.

Bu projede kullanılmamasının nedenleri:
1. **Şartname "yazıldıkça sonuçlar güncellensin" diyor.** Debounce gecikme ekler ve bu davranışla çelişir.
2. **Maliyet yok.** 10 kayıt üzerinde `filter` mikrosaniyeler sürer, ağ isteği yok.
3. **Ek karmaşıklık:** Debounce `useEffect` + `setTimeout` + cleanup ya da ayrı bir `useDebounce` hook'u gerektirir.

Veri binlerce kayda çıkarsa veya arama bir API'ye bağlanırsa şöyle eklenebilir:

```ts
// hooks/useDebouncedValue.ts (örnek, projede YOK)
export const useDebouncedValue = <T,>(value: T, delay = 300): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer); // her tuşta önceki timer iptal edilir
  }, [value, delay]);
  return debounced;
};

// useSalesDashboard içinde:
const debouncedSearch = useDebouncedValue(search);
const filteredRecords = useMemo(
  () => filterRecords(records, { search: debouncedSearch, category }),
  [records, debouncedSearch, category],
);
```

Input `search` ile anında güncellenir (yazarken takılma olmaz), filtreleme ise `debouncedSearch` ile gecikmeli çalışır. React 18+ ile gelen alternatif yerleşik çözüm ise `useDeferredValue(search)`'tür: sabit bir süre beklemek yerine React'in render önceliğini kullanır.

### `useCallback` ve `React.memo`: **kullanılmadı**

- `useCallback` fonksiyon referansını sabitler. Asıl faydası, `React.memo` ile sarılmış alt bileşenlere fonksiyon geçerken gereksiz render'ı önlemektir.
- Burada:
  - `setSearch`, `setCategory`, `setSortOrder` zaten **React tarafından sabit referanslı** olarak garanti edilir. `useCallback`'e gerek yok.
  - Bileşenler çok hafif. Ölçülmüş bir performans sorunu olmadan `React.memo` eklemek, **erken optimizasyon** olur ve kod okunurluğunu düşürür.

### Context API / Redux / Zustand: **kullanılmadı**

- State yalnızca **bir seviye** aşağı iniyor (hook → `App` → bileşen). "Prop drilling" sorunu yok.
- Global state kütüphanesi bu ölçek için gereksiz bağımlılık ve karmaşıklık olurdu.

### `useReducer`: **kullanılmadı**

- Dört bağımsız state var ve aralarında karmaşık geçiş kuralı yok. Her biri tek bir setter ile güncelleniyor.
- Bonus aşamada `records` için `add`/`delete`/`reset` aksiyonları eklenince `useReducer` mantıklı bir alternatif hâline gelebilir.

### UI kütüphanesi (MUI, AntD): **kullanılmadı**

İzinliydi, ama bileşen tasarımını ve state akışını göstermek için tercih edilmedi. Ayrıca bundle boyutu küçük kaldı (~70 KB gzip).

---

## 8. Gereksinim → kod eşlemesi

| # | Gereksinim | Karşılandığı yer |
|---|---|---|
| 1 | Veri tablosu (ürün, kategori, fiyat, adet, tutar) | `SalesTable.tsx`, `SalesTableRow.tsx`, `getRecordTotal` |
| 2 | Büyük/küçük harf duyarsız, anlık arama | `normalize()` + `filterRecords` + kontrollü `SearchInput` |
| 3 | Kategori filtresi ("Tümü" + veriden gelenler) | `getCategories` + `CategoryFilter` + `ALL_CATEGORIES` |
| 4 | Fiyata göre artan/azalan + varsayılana dönüş | `sortRecords` + `SortSelect` (`'default' \| 'asc' \| 'desc'`) |
| 5 | Özet kartları (toplam tutar, kayıt sayısı, toplam adet) | `calculateSummary` + `SummaryCards` |
| 6 | Arama + filtre + sıralama birlikte | `filterRecords` içinde `&&` + `useMemo` zinciri |
| 7 | Boş sonuç mesajı | `App.tsx` koşullu render + `EmptyState` |

| Kabul kriteri | Nasıl sağlandı? |
|---|---|
| İlk açılışta tüm kayıtlar | Başlangıç state'i: `search = ''`, `category = 'all'`, `sortOrder = 'default'` |
| Varsayılan sıra = kaynak sıra | `sortRecords` `'default'`'ta diziyi olduğu gibi döndürür; `filter` sırayı korur |
| Özet sıralamadan etkilenmez | Özet `filteredRecords`'tan, sıralama ise ayrı bir `useMemo`'da hesaplanır |
| Arama silinince kategori korunur | `search` ve `category` **ayrı state'ler**. Biri değişince diğerine dokunulmaz |
| "Tümü" seçilince arama korunur | Aynı neden |
| Sonuç yoksa özetler 0 | `reduce` başlangıç değeri `{0, 0, 0}` |

---

## 9. Kenar durumlar (edge case'ler)

### Türkçe karakterler: `toLocaleLowerCase('tr-TR')`

JavaScript'in varsayılan `toLowerCase()` fonksiyonu İngilizce kurallarını uygular:

| Girdi | `toLowerCase()` | `toLocaleLowerCase('tr-TR')` |
|---|---|---|
| `I` | `i` ❌ | `ı` ✅ |
| `İ` | `i̇` (i + birleşik nokta) ❌ | `i` ✅ |

Örnek: Kullanıcı `"HALI"` yazıyor, aranan ürün `"Halı"`.
- `toLowerCase()` ile `"hali"` aranır, `"halı"` bulunamaz.
- `tr-TR` ile `"halı"` aranır ve eşleşir.

Aynı durum `Kitaplık`, `Kulaklık`, `Monitör` için de geçerli. Hem arama metni hem ürün adı **aynı fonksiyonla** normalize edildiği için karşılaştırma tutarlıdır.

### Diğerleri

- **Sadece boşluktan oluşan arama** (`"   "`): `trim()` sonrası `''` olur, filtre uygulanmaz.
- **Arama kutusunu silme:** `type="search"` input'ları tarayıcıda bir "×" temizleme butonu da gösterir. Temizleme de `onChange` tetikler.
- **Eşit fiyatlı kayıtlar:** Kararlı `sort` sayesinde orijinal sıraları korunur.
- **Boş sonuç:** Tablo yerine `EmptyState` gösterilir. Özet kartları kaybolmaz ve `0` gösterir.

---

## 10. Stil yaklaşımı

- **CSS Modules:** `Component.module.css` içindeki `.card` class'ı derleme sırasında `_card_x7k2a` gibi benzersiz bir isme dönüşür. Bileşenler arası stil çakışması olmaz.
- **CSS değişkenleri (`index.css`):** Renkler ve köşe yuvarlaklıkları (`--color-primary`, `--radius` vb.) tek yerde tanımlı. Tema değişikliği tek dosyadan yapılabilir.
- **Responsive:**
  - Özet kartları masaüstünde 3 sütunluk `grid`. `640px` altında tek sütuna düşer.
  - Filtre çubuğu `flex-wrap` ile dar ekranda alt alta geçer.
  - Tablo bir `overflow-x: auto` sarmalayıcı içinde. Mobilde sayfa değil, yalnızca tablo yatay kayar.
- **Sayılar sağa hizalı ve `font-variant-numeric: tabular-nums` ile:** Rakamlar eşit genişlikte olduğu için basamaklar alt alta düzgün hizalanır.
- **Erişilebilirlik:**
  - Her form kontrolü bir `<label>` içinde, ekran okuyucular alanı adıyla okur.
  - Bölümlerde `aria-label` var.
  - `EmptyState`'te `role="status"` var; sonuç kalmadığında ekran okuyucuya bildirilir.
  - Semantik etiketler kullanıldı: `main`, `header`, `section`, `article`, `table`/`thead`/`tbody`.

---

## 11. Yapılandırma değişiklikleri

| Dosya | Değişiklik | Neden |
|---|---|---|
| `tsconfig.app.json` | `"resolveJsonModule": true` | TypeScript'in `.json` dosyalarını import edip tipini çıkarabilmesi için. |
| `index.html` | `lang="tr"`, `<title>Mini Satış Paneli</title>` | Doğru dil bilgisi (ekran okuyucu telaffuzu, tarayıcı çevirisi) ve sayfa başlığı. |
| `package.json` | `name: "mini-sales-dashboard"` | Vite şablonundan gelen geçici isim düzeltildi. |
| Vite şablon dosyaları | `App.css`, `assets/`, `icons.svg` silindi | Kullanılmayan boilerplate temizliği. |
| `sales-data.json` | Kök dizinden `src/data/` altına taşındı | Kaynak kodla birlikte import edilebilmesi için. |

---

## 12. Doğrulama

Şartnamedeki örnek senaryolar, util fonksiyonları doğrudan çalıştırılarak kontrol edildi:

| Senaryo | Beklenen | Sonuç |
|---|---|---|
| Filtre yok | 10 kayıt, 25 adet, 98.900 TL | ✅ |
| Kategori: Mobilya | 3 kayıt, 4 adet, 32.500 TL | ✅ |
| Arama: `lap` / `LAP` | Yalnızca Laptop | ✅ |
| Elektronik + `mouse` | Yalnızca Mouse | ✅ |
| Eşleşmeyen arama (`xyz`) | Boş durum, özetler 0 | ✅ |
| Arama: `HALI` | Halı (Türkçe ı/I) | ✅ |
| Fiyat artan | 700 → 15.000 | ✅ |
| Fiyat azalan | 15.000 → 700 | ✅ |
| Varsayılan | id sırası 1…10 | ✅ |

`npm run build` (TypeScript tip kontrolü dahil) ve `npm run lint` hatasız geçiyor.

---

## 13. Karşılaşılan sorunlar

1. **Vite boş olmayan klasöre kurulum yapmıyor.** Repo zaten `.git` ve `sales-data.json` içeriyordu, `npm create vite .` etkileşimli bir onay istiyordu. Çözüm: şablon geçici bir klasöre kuruldu, dosyalar köke taşındı, geçici klasör silindi.
2. **`git mv` başarısız oldu.** `sales-data.json` henüz commit edilmemişti (untracked), git takip etmediği dosyayı taşıyamaz. Çözüm: normal `mv` kullanıldı.
3. **JSON import'u için tip desteği.** Vite JSON'u kendiliğinden işler, ama TypeScript tipini çıkarabilmek için `resolveJsonModule` ayarı gerekti.

---

## 14. Bonuslar için yol haritası

Zorunlu gereksinimler tamamlandı. Bonuslar henüz **yapılmadı** ve şu sırayla planlandı:

| Bonus | Plan |
|---|---|
| **Silme** | Hook'a `deleteRecord(id)` eklenecek: `setRecords(prev => prev.filter(r => r.id !== id))`. `SalesTableRow`'a "Sil" butonu ve `window.confirm` onayı eklenecek. |
| **Ürün ekleme** | Yeni `AddRecordForm` bileşeni ve saf bir `validateRecord` fonksiyonu yazılacak. Kurallar: ad ve kategori zorunlu; fiyat > 0; adet ≥ 1 ve tam sayı. Yeni id = `Math.max(...ids) + 1`. |
| **localStorage** | `useState` **lazy initializer** ile başlangıçta okunacak: `useState(() => load() ?? initialRecords)`. `useEffect` ile `records` değiştikçe yazılacak. Okuma ve yazma `try/catch` içinde olacak (gizli sekme veya kota dolu olabilir). Bir "Verileri sıfırla" butonu eklenecek. |

Bu aşamada `useEffect`'in **projedeki ilk ve doğru kullanım yeri** localStorage senkronizasyonu olacak. Kayıtlar baştan beri state'te tutulduğu ve kategoriler veriden türetildiği için mevcut bileşenlerde yapısal değişiklik gerekmeyecek.
