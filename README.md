# Mini Satış Paneli

Ürün bazlı satış kayıtlarını gösteren bir React dashboard'u. Kullanıcı kayıtları:

- listeleyebilir, arayabilir,
- kategoriye göre filtreleyebilir, fiyata göre sıralayabilir,
- görüntülenen kayıtların satış özetini görebilir,
- yeni kayıt ekleyebilir, kayıt silebilir.

Veriler tarayıcıda (localStorage) saklanır.

> Bu doküman şunları anlatır:
> - Projede **hangi tekniğin nerede ve neden** kullanıldığı.
> - **Her fonksiyonun ve bileşenin** ne yaptığı ve nasıl çalıştığı.
> - **Bilerek kullanılmayanlar** (ör. debounce) ve nedenleri.
> - Alınan kararlar ve karşılaşılan sorunlar.

---

## İçindekiler

1. [Çalıştırma](#1-çalıştırma)
2. [Teknoloji seçimi](#2-teknoloji-seçimi)
3. [Klasör yapısı](#3-klasör-yapısı)
4. [Mimari ve veri akışı](#4-mimari-ve-veri-akışı)
5. [Tipler: `types/sales.ts`](#5-tipler-typessalests)
6. [Saf fonksiyonlar: `utils/`](#6-saf-fonksiyonlar-utils)
7. [Hook'lar: `hooks/`](#7-hooklar-hooks)
8. [Bileşenler: `components/` ve `App.tsx`](#8-bileşenler-components-ve-apptsx)
9. [React kavramları: nerede, nasıl kullanıldı?](#9-react-kavramları-nerede-nasıl-kullanıldı)
10. [`useEffect` ve debounce: nerede var, nerede yok?](#10-useeffect-ve-debounce-nerede-var-nerede-yok)
11. [Bilerek kullanılmayan diğer araçlar](#11-bilerek-kullanılmayan-diğer-araçlar)
12. [Gereksinim → kod eşlemesi](#12-gereksinim--kod-eşlemesi)
13. [Kenar durumlar (edge case'ler)](#13-kenar-durumlar-edge-caseler)
14. [Stil ve erişilebilirlik](#14-stil-ve-erişilebilirlik)
15. [Yapılandırma değişiklikleri](#15-yapılandırma-değişiklikleri)
16. [Doğrulama](#16-doğrulama)
17. [Karşılaşılan sorunlar](#17-karşılaşılan-sorunlar)
18. [Fonksiyon dizini (hızlı başvuru)](#18-fonksiyon-dizini-hızlı-başvuru)

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
| **TypeScript** | Veri modelleri tiplendi. Yanlış prop veya eksik alan derleme anında yakalanır. |
| **Vite** | Hızlı kurulum, anlık HMR, JSON dosyalarını doğrudan import edebilme. |
| **CSS Modules** | Ek bağımlılık yok; class isimleri bileşene özel olduğu için çakışma olmaz. |
| **UI kütüphanesi yok** | Tüm bileşenler (buton, form, tablo) elle yazıldı. Bileşen tasarımı ve state akışı doğrudan görülebiliyor. |

---

## 3. Klasör yapısı

```
src/
├── data/
│   └── sales-data.json             # Başlangıç (seed) verisi: 10 kayıt
├── types/
│   └── sales.ts                    # Tüm tipler + ALL_CATEGORIES sabiti
├── utils/                          # SAF FONKSİYONLAR (React'ten bağımsız)
│   ├── text.ts                     # normalizeText: Türkçe uyumlu küçük harfe çevirme
│   ├── format.ts                   # formatCurrency, formatNumber
│   ├── salesFilters.ts             # filtreleme, sıralama, özet, kategori listesi
│   ├── records.ts                  # kayıt ekleme/silme, yeni id üretimi      [bonus]
│   ├── validateRecord.ts           # form doğrulama + formdan kayda dönüşüm    [bonus]
│   └── recordStorage.ts            # localStorage okuma/yazma                  [bonus]
├── hooks/
│   ├── useSalesRecords.ts          # Kayıt listesi + ekle/sil/sıfırla + kalıcılık  [bonus]
│   └── useSalesDashboard.ts        # Arama/filtre/sıralama state'i + türetilmiş veriler
├── components/
│   ├── Button/                     # Yeniden kullanılabilir buton (primary/secondary/danger)  [bonus]
│   ├── AddRecordForm/              # AddRecordForm + FormField               [bonus]
│   ├── FilterBar/                  # SearchInput + CategoryFilter + SortSelect'i birleştirir
│   ├── SearchInput/
│   ├── CategoryFilter/
│   ├── SortSelect/
│   ├── SummaryCards/               # SummaryCards + SummaryCard
│   ├── SalesTable/                 # SalesTable + SalesTableRow (silme butonu dahil)
│   └── EmptyState/
├── App.tsx                         # Sayfa düzeni + kullanıcı onayları (confirm)
├── App.module.css
├── index.css                       # CSS değişkenleri + temel reset
└── main.tsx                        # React'i DOM'a bağlar (StrictMode)
```

Her bileşen kendi klasöründe, `.tsx` ve `.module.css` dosyasıyla birlikte durur.

---

## 4. Mimari ve veri akışı

Proje üç katmandan oluşur. Her katmanın tek bir sorumluluğu var (**Single Responsibility**):

```
┌────────────────────────────────────────────────────────────────────┐
│ utils/   SAF FONKSİYONLAR                                          │
│          filterRecords · sortRecords · calculateSummary            │
│          addRecord · removeRecord · validateRecord · load/save     │
└──────────────────────────────▲─────────────────────────────────────┘
                               │ çağırır
┌──────────────────────────────┴─────────────────────────────────────┐
│ hooks/   useSalesRecords     → records state'i + localStorage       │
│          useSalesDashboard   → search/category/sortOrder + useMemo  │
└──────────────────────────────▲─────────────────────────────────────┘
                               │ döndürdüğü değerleri kullanır
┌──────────────────────────────┴─────────────────────────────────────┐
│ App.tsx + components/   GÖRÜNTÜLEME                                 │
│          props alır, callback çağırır                              │
│          (yalnızca AddRecordForm kendi form state'ini tutar)       │
└────────────────────────────────────────────────────────────────────┘
```

### Hook'lar arası ilişki

```
useSalesDashboard
 ├── useSalesRecords()              ← kayıtların "sahibi" (ekle / sil / sıfırla / kaydet)
 ├── useState: search, category, sortOrder
 └── useMemo: categories → filteredRecords → summary
                                    → visibleRecords
```

### Kritik sıra: **filtrele → özetle → sırala**

```
records ──filter──► filteredRecords ──┬──► calculateSummary ──► summary
                                      └──► sortRecords ───────► visibleRecords
```

Özet, **sıralamadan önceki** listeden hesaplanır. Bu yüzden sıralama toplamları yapı gereği değiştiremez.

### Örnek akış 1: kullanıcı arama kutusuna `"lap"` yazıyor

```
1. <input> onChange             → SearchInput: onChange("lap")
2. FilterBar                    → onSearchChange = setSearch
3. useSalesDashboard            → search = "lap" → yeniden render
4. useMemo(filteredRecords)     → search değişti, yeniden hesaplanır
5. useMemo(summary)             → filteredRecords değişti, yeniden hesaplanır
6. useMemo(visibleRecords)      → filteredRecords değişti, yeniden sıralanır
7. App                          → visibleRecords.length > 0 ? <SalesTable/> : <EmptyState/>
```

### Örnek akış 2: kullanıcı bir kaydı siliyor

```
1. SalesTableRow "Sil"          → onDelete(record)
2. SalesTable                   → onDelete prop'unu satıra aktarır
3. App.handleDelete             → window.confirm(...) → onaylanırsa deleteRecord(record.id)
4. useSalesRecords.remove       → setRecords(current => removeRecord(current, id))
5. records değişti
   ├─ useEffect                 → saveRecords(records): localStorage güncellenir
   └─ useMemo zinciri           → categories, filteredRecords, summary, visibleRecords yeniden hesaplanır
```

### Örnek akış 3: kullanıcı yeni kayıt ekliyor

```
1. AddRecordForm submit         → event.preventDefault()
2. validateRecord(values)       → hata varsa setErrors(...) ve DUR
3. toNewRecord(values)          → string'ler sayıya çevrilir, kategori mevcut yazımla eşleştirilir
4. onAdd(newRecord)             → useSalesRecords.add → setRecords(current => addRecord(current, newRecord))
5. Form sıfırlanır              → setValues(EMPTY_FORM_VALUES), setErrors({})
6. records değişti              → useEffect kaydeder, useMemo zinciri yeniden hesaplar
```

---

## 5. Tipler: `types/sales.ts`

```ts
export interface SalesRecord { id: number; product: string; category: string; price: number; quantity: number; }
export type NewSalesRecord = Omit<SalesRecord, 'id'>;
export interface RecordFormValues { product: string; category: string; price: string; quantity: string; }
export type RecordFormErrors = Partial<Record<keyof RecordFormValues, string>>;
export type SortOrder = 'default' | 'asc' | 'desc';
export interface SalesFilters { search: string; category: string; }
export interface SalesSummary { totalRevenue: number; recordCount: number; totalQuantity: number; }
export const ALL_CATEGORIES = 'all';
```

| Tip / sabit | Açıklama |
|---|---|
| `SalesRecord` | Tek bir satış kaydı. JSON dosyasındaki yapının birebir karşılığı. |
| `NewSalesRecord` | `Omit<SalesRecord, 'id'>`: id'siz kayıt. Form id üretmez; id'yi `addRecord` atar. Bu tip, formun yanlışlıkla id göndermesini derleme seviyesinde engeller. |
| `RecordFormValues` | Form alanlarının **ham** değerleri. Input'lar her zaman string döndürdüğü için `price` ve `quantity` de string. Sayıya çevirme yalnızca doğrulamadan sonra yapılır. |
| `RecordFormErrors` | `Partial<Record<alan, string>>`: her alan için **opsiyonel** hata mesajı. Boş obje `{}` "hata yok" demektir. `keyof RecordFormValues` sayesinde olmayan bir alan için hata yazılamaz. |
| `SortOrder` | Union type. Yalnızca 3 değer geçerli; `'ascending'` gibi bir yazım hatası derleme hatası verir. |
| `SalesFilters` | `filterRecords`'a giden filtre parametreleri. |
| `SalesSummary` | Özet kartlarının verisi. |
| `ALL_CATEGORIES` | "Tümü" seçeneğinin iç değeri (`'all'`). Ekranda "Tümü" yazar, mantık `'all'` ile çalışır; etiket değişse de mantık bozulmaz. |

---

## 6. Saf fonksiyonlar: `utils/`

Bu klasördeki tüm fonksiyonlar **saf (pure)** fonksiyonlardır:
- Aynı girdi için her zaman aynı çıktıyı verirler.
- Aldıkları diziyi veya objeyi **değiştirmezler** (immutable).
- React'i bilmezler.

> **Tek istisna `recordStorage.ts`.** localStorage bir dış sistem olduğu için tanım gereği yan etkilidir. Yan etkiler bu tek dosyada izole edildi.

Bu ayrımın faydaları:
1. Fonksiyonlar tarayıcı olmadan test edilebilir.
2. Bileşenler kısa ve okunur kalır.
3. İş kuralları tek yerde toplanır.

### 6.1 `text.ts`

#### `normalizeText(text: string): string`

```ts
export const normalizeText = (text: string): string => text.trim().toLocaleLowerCase('tr-TR');
```

- **Ne yapar?** Metnin baş/son boşluklarını siler ve Türkçe kurallarına göre küçük harfe çevirir.
- **Nerede kullanılır?**
  - `filterRecords`: arama.
  - `validateRecord`: aynı ürün kontrolü.
  - `resolveCategory`: kategori eşleştirme.
- **Neden ayrı dosya?** Başta yalnızca `salesFilters.ts` içinde özel (private) bir fonksiyondu. Doğrulama da aynı kurala ihtiyaç duyunca ortak bir dosyaya taşındı (DRY).
- **Neden `toLocaleLowerCase('tr-TR')`?** Düz `toLowerCase()` `"I"`'yı `"i"` yapar; oysa Türkçede doğrusu `"ı"`'dır. `"HALI"` araması `"Halı"`'yı ancak böyle bulur. Ayrıntı: [Bölüm 13](#13-kenar-durumlar-edge-caseler).

### 6.2 `format.ts`

#### `formatCurrency(value: number): string`

```ts
const currencyFormatter = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });
export const formatCurrency = (value: number): string => currencyFormatter.format(value);
```

- **Ne yapar?** `98900` → `₺98.900`.
- **Nasıl?**
  - Tarayıcının yerleşik `Intl` API'si kullanılır, kütüphane gerekmez.
  - Formatter **modül seviyesinde bir kez** oluşturulur. `Intl.NumberFormat` oluşturmak maliyetlidir; her hücre ve her render için yeniden yaratılmaz.
  - `maximumFractionDigits: 0` kuruşu gizler.

#### `formatNumber(value: number): string`

- **Ne yapar?** Adet ve kayıt sayısını Türkçe binlik ayırıcıyla formatlar (`1250` → `1.250`). Aynı tekil formatter mantığını kullanır.

### 6.3 `salesFilters.ts`

#### `getRecordTotal(record: SalesRecord): number`

```ts
export const getRecordTotal = (record) => record.price * record.quantity;
```

- **Ne yapar?** "Satış tutarı = fiyat × adet" kuralını uygular.
- **Neden fonksiyon?** Kural hem tablo satırında (`SalesTableRow`) hem özette (`calculateSummary`) kullanılıyor. Tek yerde tanımlı olduğu için iki yer asla farklı hesap yapamaz.

#### `getCategories(records: SalesRecord[]): string[]`

```ts
Array.from(new Set(records.map((record) => record.category)));
```

- **Ne yapar?** Kayıtlardaki benzersiz kategorileri, ilk görülme sırasıyla döndürür.
- **Nasıl?** `map` ile kategoriler alınır, `Set` tekrarları eler, `Array.from` diziye çevirir.
- **Neden koda gömülü değil?** Kategoriler **veriden türetilir**. Yeni kategoriyle bir ürün eklenince dropdown kendiliğinden güncellenir. Bir kategorinin son ürünü silinince de dropdown'dan kendiliğinden kalkar.

#### `filterRecords(records, { search, category }): SalesRecord[]`

```ts
const query = normalizeText(search);
return records.filter((record) => {
  const matchesSearch   = query === '' || normalizeText(record.product).includes(query);
  const matchesCategory = category === ALL_CATEGORIES || record.category === category;
  return matchesSearch && matchesCategory;
});
```

- **Ne yapar?** Arama metnine **ve** kategoriye uyan kayıtları döndürür.
- **Nasıl?**
  - İki koşul `&&` ile birleşir, böylece arama ve kategori aynı anda uygulanır.
  - `query === ''`: arama boşsa ürün adı kısıtı kalkar, kategori kısıtı kalır.
  - `category === ALL_CATEGORIES`: "Tümü" seçiliyse kategori kısıtı kalkar, arama kalır.
  - `includes` ürün adının **içinde geçen** metni eşleştirir: `"lap"` ve `"top"` → `Laptop`.
  - `query` döngünün dışında **bir kez** hesaplanır.
  - `filter` yeni bir dizi döndürür ve orijinal sırayı korur.

#### `sortRecords(records, order): SalesRecord[]`

```ts
if (order === 'default') return records;
const direction = order === 'asc' ? 1 : -1;
return [...records].sort((a, b) => (a.price - b.price) * direction);
```

- **Ne yapar?** Birim fiyata göre artan veya azalan sıralar. `'default'`'ta listeye dokunmaz.
- **Nasıl?**
  - **`[...records]` kopyası alınır.** `sort` diziyi **yerinde değiştirir**. Kopya alınmasaydı state'teki dizi bozulur ve "Varsayılan" sıraya geri dönülemezdi.
  - **`'default'` için dizi olduğu gibi döner.** `filter` kaynak sırayı koruduğu için bu, "varsayılan sıralama = kaynak verideki sıra" kuralını sağlar.
  - **`direction` çarpanı:** iki ayrı karşılaştırma fonksiyonu yazmak yerine sonuç `1` veya `-1` ile çarpılır.
  - **Eşit fiyatlar:** ES2019'dan beri `sort` **kararlıdır (stable)**, eşit fiyatlılar orijinal sıralarını korur.

#### `calculateSummary(records): SalesSummary`

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

- **Ne yapar?** Toplam satış tutarını, kayıt sayısını ve toplam adedi hesaplar.
- **Nasıl?**
  - Liste **tek bir `reduce`** ile, yalnızca bir kez dolaşılır.
  - Başlangıç değeri `{0, 0, 0}`. Liste boşsa `reduce` bunu olduğu gibi döndürür, yani "sonuç yoksa özetler 0" kuralı ek bir `if` gerekmeden sağlanır.
  - `reduce<SalesSummary>` generic'i accumulator'ın tipini sabitler.

### 6.4 `records.ts` [bonus]

#### `getNextId(records): number`

```ts
records.reduce((maxId, record) => Math.max(maxId, record.id), 0) + 1;
```

- **Ne yapar?** Mevcut en büyük id'nin bir fazlasını döndürür.
- **Neden `records.length + 1` değil?** Silme sonrası çakışma olur. Örneğin 10 kayıttan id=3 silinirse `length + 1 = 10` olur, ama id=10 zaten var. Bu da duplicate key ve yanlış silme demektir.
- **Neden `Math.max(...ids)` değil?** Liste boşsa `Math.max()` `-Infinity` döndürür. `reduce` ise başlangıç değeri `0` olduğu için boş listede güvenle `1` döndürür. Ayrıca çok büyük dizilerde spread argüman limitine takılmaz.

#### `addRecord(records, newRecord): SalesRecord[]`

```ts
[...records, { id: getNextId(records), ...newRecord }];
```

- **Ne yapar?** Yeni kaydı id atayarak listenin **sonuna** ekler ve **yeni bir dizi** döndürür.
- **Neden sona?** Varsayılan sıralama kaynak sırası olduğu için yeni kayıt en altta görünür, bu da tutarlıdır.
- **Neden `push` değil?** `push` mevcut diziyi değiştirir. React state'i değişmediğini sanar (aynı referans) ve ekranı güncellemez.

#### `removeRecord(records, id): SalesRecord[]`

```ts
records.filter((record) => record.id !== id);
```

- **Ne yapar?** Verilen id dışındaki kayıtlardan **yeni bir dizi** oluşturur.
- **Neden `splice` değil?** Aynı immutability nedeni.

### 6.5 `validateRecord.ts` [bonus]

Form doğrulaması **bileşenden ayrı**, saf fonksiyonlar olarak yazıldı. Her alanın kendi küçük doğrulayıcısı var; ana fonksiyon bunları birleştirir.

| Fonksiyon / sabit | Dışa açık mı? | Ne yapar? |
|---|---|---|
| `MAX_PRODUCT_LENGTH` | ✅ | `50`. Hem doğrulamada hem input'un `maxLength` özelliğinde kullanılır. Limit tek yerde. |
| `EMPTY_FORM_VALUES` | ✅ | Formun başlangıç ve sıfırlama değeri (tüm alanlar `''`). |
| `isDuplicate(values, records)` | ❌ | Aynı kategoride aynı isimli ürün var mı? İkisi de `normalizeText` ile karşılaştırılır: `"LAPTOP"` + `"elektronik"` → mevcut `Laptop/Elektronik` ile eşleşir. |
| `validateProduct(values, records)` | ❌ | Kurallar: zorunlu (trim sonrası boş olamaz), en fazla 50 karakter, aynı kategoride tekrar olamaz. |
| `validateCategory(category)` | ❌ | Kural: zorunlu. |
| `validatePrice(price)` | ❌ | Kurallar: zorunlu, sayı olmalı, `> 0` olmalı. |
| `validateQuantity(quantity)` | ❌ | Kurallar: zorunlu, **tam sayı** ve `≥ 1` olmalı. |
| `validateRecord(values, records)` | ✅ | Dört doğrulayıcıyı çalıştırır, **yalnızca hatalı alanları** içeren bir obje döndürür. |
| `hasErrors(errors)` | ✅ | `Object.keys(errors).length > 0`: okunurluk için isimlendirilmiş kontrol. |
| `resolveCategory(input, categories)` | ❌ | Yazılan kategori mevcut biriyle büyük/küçük harf duyarsız eşleşirse **mevcut yazımı** kullanır. |
| `toNewRecord(values, categories)` | ✅ | Doğrulanmış form değerlerini bir `NewSalesRecord`'a çevirir. |

#### `validatePrice` ve `validateQuantity` ayrıntısı

```ts
const value = Number(price);
if (!Number.isFinite(value) || value <= 0) return 'Birim fiyat 0’dan büyük olmalıdır.';
```

- **`Number(...)` kullanıldı, `parseFloat` değil.** `parseFloat("12abc")` `12` döndürür, yani yanlışlıkla geçerli sayılır. `Number("12abc")` ise `NaN` döndürür ve reddedilir.
- **`Number.isFinite`** hem `NaN`'ı hem `Infinity`'yi reddeder.
- **`Number.isInteger`** adette `1.5` gibi küsuratlı değerleri reddeder.

#### `validateRecord` neden hatasız alanları siliyor?

```ts
const errors = { product: validateProduct(...), category: ..., price: ..., quantity: ... };
return Object.fromEntries(Object.entries(errors).filter(([, message]) => message !== undefined));
```

- Her doğrulayıcı hata mesajı ya da `undefined` döndürür.
- `undefined` olanlar elenir. Böylece **boş obje = geçerli form** kuralı oluşur ve `hasErrors` tek satırla kontrol yapabilir.

#### `resolveCategory` neden var?

Kullanıcı kategori alanına `"elektronik"` yazarsa, bu fonksiyon olmadan `"Elektronik"`'in yanında **ikinci bir kategori** oluşurdu. Bu durumda dropdown'da iki seçenek görünür ve filtre ikiye bölünürdü. `resolveCategory` yazılan değeri mevcut kategorilerle `normalizeText` üzerinden karşılaştırır ve eşleşme varsa mevcut yazımı (`"Elektronik"`) kullanır. Eşleşme yoksa yeni kategori olarak trim'lenmiş hâli kullanılır.

#### `toNewRecord(values, categories)`

```ts
({ product: values.product.trim(), category: resolveCategory(values.category, categories),
   price: Number(values.price), quantity: Number(values.quantity) })
```

- Metinler `trim` edilir: `" Tablet "` → `"Tablet"`.
- String değerler sayıya çevrilir.
- Kategori, `resolveCategory` ile mevcut yazıma eşleştirilir.

**Sıra önemli:** Bu fonksiyon yalnızca `validateRecord` geçtikten sonra çağrılır, bu yüzden `Number(...)` sonucu her zaman geçerli bir sayıdır.

### 6.6 `recordStorage.ts` [bonus]

| Fonksiyon / sabit | Ne yapar? |
|---|---|
| `STORAGE_KEY` | `'mini-sales-dashboard:records'`. Aynı origin'deki başka uygulamalarla çakışmaması için proje önekli. |
| `isSalesRecord(value)` | **Type guard** (`value is SalesRecord`). Bir değerin gerçekten `SalesRecord` yapısında olduğunu çalışma zamanında kontrol eder. |
| `loadRecords()` | localStorage'dan okur. Kullanılabilir veri yoksa **`null`** döndürür. |
| `saveRecords(records)` | Kayıtları JSON olarak yazar. Hata olursa sessizce devam eder. |

#### `loadRecords()` ayrıntısı

```ts
try {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  const parsed: unknown = JSON.parse(raw);
  return Array.isArray(parsed) && parsed.every(isSalesRecord) ? parsed : null;
} catch {
  return null;
}
```

- **`null` döndürmesinin anlamı:** "kayıtlı veri yok, başlangıç verisini kullan". Çağıran taraf `loadRecords() ?? initialRecords` ile buna göre davranır.
- **`try/catch` neden var?**
  - Gizli sekmede veya site verileri engellendiğinde `localStorage` erişimi **hata fırlatabilir**.
  - Bozuk bir JSON'da `JSON.parse` hata fırlatır.
  - İki durumda da uygulama çökmez, başlangıç verisiyle açılır.
- **`unknown` + type guard neden?**
  - `JSON.parse` çıktısına güvenilmez: kullanıcı DevTools'tan değiştirmiş olabilir ya da eski bir sürümün formatı kalmış olabilir.
  - Veri `unknown` tipiyle alınır ve `isSalesRecord` ile **doğrulanmadan** kullanılmaz.
  - Yapısı bozuk veri (ör. `[{ "id": "x" }]`) reddedilir.

#### `saveRecords(records)` ayrıntısı

- `JSON.stringify` ile yazar.
- `try/catch` kota dolması (`QuotaExceededError`) veya engelli depolama durumunu yakalar. Uygulama bellekte çalışmaya devam eder, yalnızca kalıcılık kaybolur.

---

## 7. Hook'lar: `hooks/`

State mantığı **iki custom hook'a** bölündü. Her birinin tek sorumluluğu var:

| Hook | Sorumluluk | State |
|---|---|---|
| `useSalesRecords` | Kayıtların **sahibi**: ekle, sil, sıfırla, localStorage'a kaydet | `records` |
| `useSalesDashboard` | **Görüntüleme**: arama, filtre, sıralama ve bunlardan türeyen veriler | `search`, `category`, `sortOrder` |

`useSalesDashboard`, `useSalesRecords`'u **içeriden çağırır** (hook composition). Bu sayede `App` tek bir hook kullanır ama mantık iki dosyaya ayrılmış olur.

### 7.1 `useSalesRecords()` [bonus]

```ts
const [records, setRecords] = useState<SalesRecord[]>(() => loadRecords() ?? initialRecords);

useEffect(() => {
  saveRecords(records);
}, [records]);

const add    = (newRecord) => setRecords((current) => addRecord(current, newRecord));
const remove = (id)        => setRecords((current) => removeRecord(current, id));
const reset  = ()          => setRecords(initialRecords);

return { records, addRecord: add, deleteRecord: remove, resetRecords: reset };
```

#### Lazy initializer: `useState(() => ...)`

- `useState(loadRecords() ?? initialRecords)` yazılsaydı `loadRecords()` **her render'da** çalışırdı: localStorage okunur, JSON parse edilir ve sonuç çöpe atılırdı.
- Fonksiyon olarak (`() => ...`) verilince React onu **yalnızca ilk render'da** çağırır.
- `??` (nullish coalescing): `loadRecords()` `null` döndürürse JSON'daki başlangıç verisi kullanılır.

#### `useEffect`: localStorage senkronizasyonu

- **Ne yapar?** `records` her değiştiğinde (ekleme, silme, sıfırlama) güncel listeyi localStorage'a yazar.
- **Neden `useEffect`?** localStorage **React dışında bir sistemdir**. React state'ini dış bir sistemle senkron tutmak, `useEffect`'in tam olarak tasarlandığı iştir.
- **Bağımlılık dizisi `[records]`:** Arama yazarken veya sıralama değişirken **çalışmaz**, yalnızca kayıt listesi değişince çalışır.
- **İlk render'da da çalışır:** O an okunan veri tekrar yazılır. Zararsız ve idempotenttir. Seed veri ilk açılışta localStorage'a da yazılmış olur.
- **Neden kaydetme `add`/`remove` içinde değil?**
  - Her aksiyona `saveRecords` eklemek tekrara yol açar ve yeni bir aksiyonda unutulabilir.
  - Effect ise "**records ne şekilde değişirse değişsin** kaydet" der. Tek yer, unutulamaz.

#### Fonksiyonel güncelleme: `setRecords((current) => ...)`

- `setRecords(addRecord(records, x))` yerine `setRecords(current => addRecord(current, x))` kullanıldı.
- Fonksiyonel form, React'in **en güncel state'i** vermesini garanti eder. Kısa sürede art arda iki güncelleme olursa ikisi de doğru uygulanır; eski (stale) `records` değeriyle çalışılmaz.

#### `reset()`

- `setRecords(initialRecords)`: JSON'daki başlangıç verisine döner.
- Ayrıca localStorage'ı silmeye gerek yok. `records` değiştiği için effect, başlangıç verisini localStorage'a yazar.

#### Dönüş isimleri

İçeride `add`, `remove`, `reset` adları kullanılıyor. Dışarıya `addRecord`, `deleteRecord`, `resetRecords` olarak açılıyor. Böylece `utils/records.ts`'teki `addRecord` saf fonksiyonuyla **isim çakışması** önlenir ve dışarıdan bakınca ne yaptıkları açık olur.

### 7.2 `useSalesDashboard()`

```ts
const { records, addRecord, deleteRecord, resetRecords } = useSalesRecords();
const [search, setSearch]       = useState('');
const [category, setCategory]   = useState(ALL_CATEGORIES);
const [sortOrder, setSortOrder] = useState<SortOrder>('default');

const categories      = useMemo(() => getCategories(records), [records]);
const activeCategory  = categories.includes(category) ? category : ALL_CATEGORIES;
const filteredRecords = useMemo(() => filterRecords(records, { search, category: activeCategory }), [records, search, activeCategory]);
const summary         = useMemo(() => calculateSummary(filteredRecords), [filteredRecords]);
const visibleRecords  = useMemo(() => sortRecords(filteredRecords, sortOrder), [filteredRecords, sortOrder]);
```

#### Minimal state ilkesi

- State'te **yalnızca kullanıcının doğrudan değiştirdiği** değerler var.
- `categories`, `filteredRecords`, `summary` ve `visibleRecords` state **değildir**; her render'da türetilir.
- Örneğin `summary` ayrı bir state olsaydı, her filtre değişiminde onu da elle güncellemek gerekirdi. Birini unutmak tablo ile özetin **senkronizasyonunun bozulması** demektir. Türetilmiş veri bu hata sınıfını ortadan kaldırır.

#### `activeCategory` [bonus ile eklendi]

- **Sorun:** Kullanıcı "Dekorasyon"u seçip bu kategorideki iki ürünü de silerse:
  - Kategori dropdown'dan kalkar,
  - ama `category` state'i hâlâ `"Dekorasyon"` olur,
  - filtre hiçbir şey bulamaz ve ekran açıklamasız biçimde boş kalır.
- **Çözüm:** Seçili kategori artık listede yoksa `ALL_CATEGORIES`'e düşülür.
- **Neden `useEffect` + `setCategory` ile değil?** Bu da **türetilmiş** bir değer. Render sırasında tek satırla hesaplanır; ekstra render ve senkronizasyon gerekmez. (Bkz. [Bölüm 10](#10-useeffect-ve-debounce-nerede-var-nerede-yok).)
- Hook dışarıya `category: activeCategory` döndürür, böylece dropdown da her zaman geçerli bir değer gösterir.

#### `useMemo` tablosu

`useMemo(fn, deps)`, `fn`'in sonucunu saklar ve yalnızca `deps` dizisindeki değerlerden biri değişince yeniden hesaplar.

| Değer | Bağımlılıklar | Ne zaman yeniden hesaplanır? |
|---|---|---|
| `categories` | `[records]` | Yalnızca kayıt eklenince/silinince. Arama yazarken hesaplanmaz. |
| `filteredRecords` | `[records, search, activeCategory]` | Kayıtlar, arama veya kategori değişince. **Sıralama değişince hesaplanmaz.** |
| `summary` | `[filteredRecords]` | Filtre sonucu değişince. **Sıralama değişince hesaplanmaz.** |
| `visibleRecords` | `[filteredRecords, sortOrder]` | Filtre sonucu veya sıralama değişince. |

> **Dürüst not:** Bu veri boyutunda `useMemo` olmadan da performans farkı hissedilmez. Kullanılmasının asıl nedenleri:
> 1. Bağımlılık dizileri **hangi verinin neye bağlı olduğunu** belgeliyor.
> 2. Sıralama değişince `summary` referansı aynı kalıyor; "sıralama özeti etkilemez" ilişkisi kodda görünür.
> 3. Veri büyüdüğünde ölçeklenir.

---

## 8. Bileşenler: `components/` ve `App.tsx`

Bileşenlerin hepsi **presentational (sunum) bileşenidir**: veriyi props ile alır, aksiyonu callback prop ile yukarı bildirir.

**Tek istisna `AddRecordForm`.** Formun yazılmakta olan değerleri ve hata mesajları **yalnızca forma ait geçici UI state'i** olduğu için bileşenin içinde tutulur. Bu değerleri başka hiçbir bileşen kullanmaz; yukarı taşımak gereksiz karmaşıklık olurdu.

### 8.1 `App.tsx`: Sayfa düzeni

| Fonksiyon | Ne yapar? |
|---|---|
| `App` | `useSalesDashboard()`'u çağırır ve bileşenlere prop dağıtır. Sıra: başlık + sıfırla butonu → filtreler → özet kartları → ekleme formu → tablo veya boş durum. |
| `handleDelete(record)` | `window.confirm` ile onay ister. Onaylanırsa `deleteRecord(record.id)` çağırır. Mesajda ürün adı geçer (`"Laptop" kaydını silmek istediğinize emin misiniz?`). |
| `handleReset()` | Tüm değişikliklerin kaybolacağını söyleyen bir onay ister. Onaylanırsa `resetRecords()` çağırır. |

**Neden `confirm` hook'ta değil de `App`'te?** `window.confirm` bir **UI etkileşimidir**. Hook'lar UI'dan bağımsız kalmalı. `deleteRecord` ileride onaysız da çağrılabilir (ör. "geri al" özelliği).

**Neden `confirm` satır bileşeninde değil?** Satır yalnızca "sil'e basıldı" bilgisini yukarı bildirir. Ne olacağına (onay, silme) üst katman karar verir. Böylece satır bileşeni basit ve tekrar kullanılabilir kalır.

### 8.2 Filtre bileşenleri

| Bileşen | Props | Açıklama |
|---|---|---|
| `SearchInput` | `value`, `onChange(value)` | Kontrollü `<input type="search">`. Her tuşta `onChange(event.target.value)`. |
| `CategoryFilter` | `categories`, `value`, `onChange(value)` | İlk seçenek "Tümü" (`ALL_CATEGORIES`), ardından `categories.map(...)` ile veriden gelenler. |
| `SortSelect` | `value: SortOrder`, `onChange(SortOrder)` | Seçenekler `SORT_OPTIONS` dizisinden üretilir. |
| `FilterBar` | 7 prop | **Composition:** üç kontrolü yan yana dizer, prop'ları dağıtır. Kendi mantığı yok. |

**`SortSelect` içindeki `as SortOrder`:** `<select>` DOM'dan her zaman `string` döndürür. Seçenekler yalnızca `SORT_OPTIONS`'tan üretildiği için değerin bir `SortOrder` olduğu garantidir; tip dönüşümü güvenlidir.

### 8.3 Özet bileşenleri

| Bileşen | Props | Açıklama |
|---|---|---|
| `SummaryCards` | `summary` | Üç kart render eder; değerleri `formatCurrency` / `formatNumber` ile formatlar. |
| `SummaryCard` | `title`, `value` | Tek kart. Formatlanmış string alır, hesap yapmaz. |

### 8.4 Tablo bileşenleri

| Bileşen | Props | Açıklama |
|---|---|---|
| `SalesTable` | `records`, `onDelete(record)` | Başlık satırı + `records.map` ile satırlar. `key={record.id}`. Son sütun başlığı ekranda görünmez, ekran okuyucu için "İşlemler" yazar (`visuallyHidden`). |
| `SalesTableRow` | `record`, `onDelete(record)` | Tek satır. Tutar `getRecordTotal` ile hesaplanır. Bir "Sil" butonu içerir. |

**"Sil" butonu:**

```tsx
<Button variant="danger" size="sm" onClick={() => onDelete(record)} aria-label={`${record.product} kaydını sil`}>Sil</Button>
```

- `onDelete`'e yalnızca id değil **tüm kayıt** gönderilir, çünkü onay mesajında ürün adı gösteriliyor.
- `aria-label`: ekranda her satırda "Sil" yazar, ama ekran okuyucu "Laptop kaydını sil" der. Hangi satırın silindiği anlaşılır.

**`key` için neden id, neden index değil?** Sıralama ve silme satırların index'ini değiştirir. Index key olsaydı React satırları karıştırabilirdi: yanlış satırın DOM'u yeniden kullanılır, hatta input/focus durumu yanlış satıra geçer. `id` benzersiz ve kalıcıdır.

### 8.5 `EmptyState`

| Props | Açıklama |
|---|---|
| `title?`, `description?` | Varsayılan değerler destructuring ile verilir: `title = 'Eşleşen kayıt bulunamadı'`. `role="status"` sayesinde ekran okuyucu sonuç kalmadığını duyurur. |

`App` içinde `visibleRecords.length > 0 ? <SalesTable/> : <EmptyState/>` koşuluyla gösterilir. Özet kartları kaybolmaz, `0` gösterir.

### 8.6 `Button` [bonus]

```tsx
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'md' | 'sm';
}
const Button = ({ variant = 'primary', size = 'md', type = 'button', className = '', ...rest }) => (
  <button type={type} className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`.trim()} {...rest} />
);
```

- **`extends ButtonHTMLAttributes`:** `onClick`, `disabled`, `aria-label` ve `children` gibi tüm yerel `<button>` özelliklerini tek tek tanımlamadan kabul eder. `...rest` ile `<button>`'a aktarılır.
- **`type = 'button'` varsayılanı önemli.** HTML'de `<button>`'un varsayılan tipi `submit`'tir. Bir form içine konan sıradan bir buton yanlışlıkla formu gönderirdi. Formun gönderme butonu bilerek `type="submit"` verir.
- **3 kullanım yeri:**
  - "Ekle" (`primary`, submit),
  - "Verileri sıfırla" (`secondary`),
  - "Sil" (`danger`, `sm`).

  Stil tek yerde tanımlı.

### 8.7 `AddRecordForm` ve `FormField` [bonus]

#### `FormField({ id, label, error, children })`

- Etiket + input (children) + hata mesajı üçlüsünü saran küçük bir yerleşim bileşeni. Dört alan için aynı HTML tekrarlanmaz.
- `label htmlFor={id}`: etikete tıklayınca input'a odaklanılır, ekran okuyucu alanı adıyla okur.
- Hata mesajı `id={`${id}-error`}` ve `role="alert"` alır. Mesaj belirdiğinde ekran okuyucu hemen okur.

#### `AddRecordForm({ records, categories, onAdd })`

**State:**

```ts
const [values, setValues] = useState<RecordFormValues>(EMPTY_FORM_VALUES);
const [errors, setErrors] = useState<RecordFormErrors>({});
```

- Dört ayrı `useState` yerine **tek bir obje**. Alanlar birlikte doğrulanıyor, birlikte sıfırlanıyor; tek obje bunu sadeleştirir.

**`handleChange(event)`: tüm input'lar için tek handler**

```ts
const { name, value } = event.target;
setValues((current) => ({ ...current, [name]: value }));
setErrors((current) => ({ ...current, [name]: undefined }));
```

- Input'un `name` özelliği state'teki anahtarla aynı (`product`, `price`...). **Computed property** (`[name]`) ile doğru alan güncellenir. Dört ayrı handler yazılmaz.
- `...current` spread ile diğer alanlar korunur (immutable güncelleme).
- **Hata temizleme:** Kullanıcı hatalı alanı düzeltmeye başladığında o alanın hata mesajı kaybolur. Diğer alanların hataları kalır.

**`handleSubmit(event)`**

```ts
event.preventDefault();                                   // sayfa yenilenmesini engelle
const validationErrors = validateRecord(values, records);
if (hasErrors(validationErrors)) { setErrors(validationErrors); return; }   // erken çıkış
onAdd(toNewRecord(values, categories));
setValues(EMPTY_FORM_VALUES);
setErrors({});
```

- **`preventDefault`:** HTML formunun varsayılan davranışı (sayfayı yenileyip veriyi göndermek) engellenir.
- **Erken çıkış (guard clause):** Hata varsa hatalar gösterilir ve fonksiyon biter. İç içe `if/else` olmaz.
- **Başarılı olursa:** Kayıt üst katmana bildirilir, form temizlenir.
- **Doğrulama yalnızca gönderimde yapılır.** Kullanıcı daha yazmayı bitirmeden "zorunlu alan" hataları görmez.

**`inputProps(name)`: ortak input özellikleri**

```ts
const inputProps = (name: keyof RecordFormValues) => ({
  id: `record-${name}`, name, value: values[name], onChange: handleChange,
  className: ..., 'aria-invalid': Boolean(errors[name]),
  'aria-describedby': errors[name] ? `record-${name}-error` : undefined,
});
```

- Dört input'un tekrar eden 7 özelliğini tek yerde üretir: `<input {...inputProps('price')} type="number" />`.
- `keyof RecordFormValues` tipi sayesinde `inputProps('prise')` gibi bir yazım hatası derleme hatası verir.
- `aria-invalid` ve `aria-describedby`: ekran okuyucu alanın hatalı olduğunu ve hata metnini okur.

**Kategori alanı: `<input list>` + `<datalist>`**

- Kategori alanı hem **mevcut kategorilerden seçim** hem **yeni kategori yazma** imkânı verir.
- `<select>` yeni değer yazmaya izin vermezdi. Serbest `<input>` ise öneri sunmazdı.
- `datalist` iki ihtiyacı da tarayıcının yerleşik özelliğiyle, kütüphanesiz karşılar.

**`noValidate`:**
- Tarayıcının kendi doğrulama balonları (`min`, `required` vb.) kapatıldı.
- Bunun yerine `validateRecord` mesajları gösteriliyor. Böylece tüm tarayıcılarda **tutarlı, Türkçe ve aynı yerde** hata gösterilir.
- `min`/`step` özellikleri yine de kalır: sayı input'unun ok tuşları ve mobil klavye doğru davranır.

---

## 9. React kavramları: nerede, nasıl kullanıldı?

| Kavram | Nerede? | Nasıl / Neden? |
|---|---|---|
| **`useState`** | `useSalesRecords`, `useSalesDashboard`, `AddRecordForm` | Toplam 6 state: `records`, `search`, `category`, `sortOrder`, form `values` ve form `errors`. |
| **Lazy initial state** | `useSalesRecords` | `useState(() => loadRecords() ?? initialRecords)`: localStorage yalnızca ilk render'da okunur. |
| **Fonksiyonel state güncellemesi** | `useSalesRecords`, `AddRecordForm` | `setRecords(current => ...)`, `setValues(current => ...)`: her zaman en güncel state ile çalışır. |
| **`useEffect`** | `useSalesRecords` (**tek yer**) | `records` değiştikçe localStorage'a yazar. Bkz. [Bölüm 10](#10-useeffect-ve-debounce-nerede-var-nerede-yok). |
| **`useMemo`** | `useSalesDashboard` | 4 türetilmiş veri. Bkz. [7.2](#72-usesalesdashboard). |
| **Custom hook** | `useSalesRecords`, `useSalesDashboard` | State ve iş mantığını UI'dan ayırır. |
| **Hook composition** | `useSalesDashboard` → `useSalesRecords` | Bir hook başka bir hook'u kullanarak sorumlulukları böler. |
| **Türetilmiş değer** | `activeCategory`, `filteredRecords`, `summary`... | State yerine render sırasında hesaplanır. |
| **Controlled components** | `SearchInput`, `CategoryFilter`, `SortSelect`, `AddRecordForm` | Input'un değeri her zaman React state'inden gelir. DOM ile state ayrışmaz. |
| **Lifting state up** | Filtre state'i hook'ta | Filtreler, tablo ve özet aynı state'i paylaştığı için ortak üst noktada tutulur. |
| **Colocation (yerel state)** | `AddRecordForm` | Yalnızca formu ilgilendiren state yukarı taşınmadı, formda tutuldu. |
| **Props + callback props** | Tüm bileşenler | Veri aşağı, olaylar yukarı: **tek yönlü veri akışı**. |
| **Composition / `children`** | `FilterBar`, `FormField`, `SummaryCards` | Küçük bileşenlerden büyükleri kurulur; `FormField` içeriği `children` ile alır. |
| **Props spreading** | `Button` (`...rest`), `AddRecordForm` (`{...inputProps(...)}`) | Tekrarlanan özellikler tek yerde üretilip aktarılır. |
| **Liste render + `key`** | `SalesTable`, `CategoryFilter`, `SortSelect`, `datalist` | `key={record.id}` / `key={category}`: benzersiz, kalıcı değerler. |
| **Koşullu render** | `App` (tablo/boş durum), `FormField` (`{error && ...}`) | |
| **Varsayılan prop değerleri** | `EmptyState`, `Button` | Destructuring default'ları. |
| **Form olayları** | `AddRecordForm` | `onSubmit` + `event.preventDefault()`. |
| **`StrictMode`** | `main.tsx` | Geliştirmede bileşenleri ve effect'leri iki kez çalıştırarak yan etki hatalarını ortaya çıkarır. |

---

## 10. `useEffect` ve debounce: nerede var, nerede yok?

### `useEffect`: **yalnızca bir yerde**, localStorage için

`useEffect` **React dışındaki bir sistemle senkronizasyon** içindir: localStorage, API, `document.title`, event listener, timer gibi. Projede bunun tek örneği localStorage'a kaydetmek:

```ts
// hooks/useSalesRecords.ts
useEffect(() => {
  saveRecords(records);
}, [records]);
```

Projede `useEffect`'in **bilerek kullanılmadığı** yerler var. Sık yapılan hata, türetilmiş veriyi effect ile hesaplayıp state'e yazmaktır:

```ts
// ❌ YANLIŞ
const [filtered, setFiltered] = useState(records);
useEffect(() => {
  setFiltered(filterRecords(records, { search, category }));
}, [records, search, category]);
```

Bu yaklaşımın sorunları:
1. **Ekstra render:** Önce eski `filtered` ile render olur, sonra effect çalışır, `setFiltered` tetiklenir ve ikinci bir render olur.
2. **Bir anlık tutarsız ekran:** Arama değişmiş ama tablo hâlâ eski olabilir.
3. **Gereksiz ikinci kaynak:** İki state'in senkron tutulması gerekir.

```ts
// ✅ DOĞRU: render sırasında türet
const filteredRecords = useMemo(() => filterRecords(records, { search, category }), [records, search, category]);
```

Aynı ilke `activeCategory` için de uygulandı. Silinen kategoriyi temizlemek için `useEffect(() => setCategory('all'))` yazılmadı; değer tek satırla türetildi. React dokümantasyonu da bunu önerir: *"You Might Not Need an Effect"*.

| Yer | `useEffect` var mı? | Neden? |
|---|---|---|
| localStorage'a kaydetme | ✅ | Dış sistemle senkronizasyon. |
| localStorage'dan okuma | ❌ (lazy `useState`) | Effect ile okumak önce seed veriyi gösterip sonra değiştirirdi (titreme + ekstra render). Lazy initializer ilk render'da doğru veriyle başlar. |
| Filtreleme / özet / sıralama | ❌ (`useMemo`) | Türetilmiş veri. |
| Silinen kategoride "Tümü"ye düşme | ❌ (türetilmiş `activeCategory`) | Türetilmiş veri. |
| Form hatalarını temizleme | ❌ (event handler içinde) | Kullanıcı aksiyonuna tepki, handler'da yapılır. |

### Debounce: **kullanılmadı**

Debounce, kullanıcı yazmayı bıraktıktan **belirli bir süre sonra** işlemi tetikler (ör. 300 ms). Pahalı işlemler (API isteği, binlerce kaydı filtreleme) için kullanılır.

Bu projede kullanılmamasının nedenleri:
1. **Şartname "yazıldıkça sonuçlar güncellensin" diyor.** Debounce gecikme ekler ve bu davranışla çelişir.
2. **Maliyet yok.** Birkaç düzine kayıtta `filter` mikrosaniyeler sürer, ağ isteği yok.
3. **Ek karmaşıklık:** `useEffect` + `setTimeout` + cleanup gerektirir.

Veri çok büyürse veya arama bir API'ye bağlanırsa şöyle eklenebilir:

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
  () => filterRecords(records, { search: debouncedSearch, category: activeCategory }),
  [records, debouncedSearch, activeCategory],
);
```

Input `search` ile anında güncellenir, filtre ise `debouncedSearch` ile gecikmeli çalışır. Yerleşik bir alternatif `useDeferredValue(search)`'tür: sabit süre beklemek yerine React'in render önceliğini kullanır.

---

## 11. Bilerek kullanılmayan diğer araçlar

| Araç | Neden kullanılmadı? |
|---|---|
| **`useCallback`** | Asıl faydası, `React.memo`'lu alt bileşenlere sabit fonksiyon referansı geçmektir. `setSearch` gibi setter'lar zaten React tarafından sabit referanslı garanti edilir. Ölçülmüş bir performans sorunu yok. |
| **`React.memo`** | Bileşenler çok hafif. Ölçüm olmadan eklemek **erken optimizasyon** olur. |
| **`useReducer`** | `records` için 3 basit aksiyon var (ekle/sil/sıfırla); her biri tek satırlık bir saf fonksiyonla ifade ediliyor. Aksiyon sayısı ve geçiş kuralları artarsa `useReducer`'a geçmek doğal bir sonraki adım olur. Saf `addRecord`/`removeRecord` fonksiyonları reducer'a doğrudan taşınabilir. |
| **Context / Redux / Zustand** | State yalnızca bir seviye aşağı iniyor (hook → `App` → bileşen). Prop drilling sorunu yok. |
| **Form kütüphanesi** (React Hook Form, Formik) | 4 alanlı tek bir form için gereksiz bağımlılık. Doğrulama zaten saf fonksiyonlarda. |
| **Şema doğrulama** (Zod, Yup) | `isSalesRecord` type guard'ı ve `validateRecord` bu ölçek için yeterli. |
| **UI kütüphanesi** | İzinliydi, ama bileşen tasarımını göstermek için tercih edilmedi. Bundle küçük kaldı (~72 KB gzip). |
| **`uuid` / `crypto.randomUUID`** | Veri modelindeki id `number`. `getNextId` mevcut yapıyla uyumlu ve yeterli. |

---

## 12. Gereksinim → kod eşlemesi

### Zorunlu gereksinimler

| # | Gereksinim | Karşılandığı yer |
|---|---|---|
| 1 | Veri tablosu | `SalesTable`, `SalesTableRow`, `getRecordTotal` |
| 2 | Büyük/küçük harf duyarsız, anlık arama | `normalizeText` + `filterRecords` + kontrollü `SearchInput` |
| 3 | Kategori filtresi | `getCategories` + `CategoryFilter` + `ALL_CATEGORIES` |
| 4 | Fiyata göre artan/azalan + varsayılan | `sortRecords` + `SortSelect` |
| 5 | Özet kartları | `calculateSummary` + `SummaryCards` |
| 6 | Hepsi birlikte | `filterRecords` içindeki `&&` + `useMemo` zinciri |
| 7 | Boş sonuç mesajı | `App` koşullu render + `EmptyState` |

### Kabul kriterleri

| Kriter | Nasıl sağlandı? |
|---|---|
| İlk açılışta tüm kayıtlar | Başlangıç state'i: `search = ''`, `category = 'all'`, `sortOrder = 'default'` |
| Varsayılan sıra = kaynak sıra | `sortRecords('default')` diziyi olduğu gibi döndürür; `filter` sırayı korur |
| Özet sıralamadan etkilenmez | Özet `filteredRecords`'tan, sıralama ise ayrı `useMemo`'da hesaplanır |
| Arama silinince kategori korunur | `search` ve `category` ayrı state'ler |
| "Tümü" seçilince arama korunur | Aynı neden |
| Sonuç yoksa özetler 0 | `reduce` başlangıç değeri `{0, 0, 0}` |

### Bonuslar

| Bonus | Karşılandığı yer |
|---|---|
| **Yeni ürün ekleme + doğrulama** | `AddRecordForm`, `FormField`, `validateRecord.ts`, `records.addRecord`, `useSalesRecords.add` |
| **Ürün silme** | `SalesTableRow` "Sil" butonu → `App.handleDelete` (onay) → `useSalesRecords.remove` → `records.removeRecord` |
| **localStorage** | `recordStorage.ts` + `useSalesRecords` (lazy init + `useEffect`) + "Verileri sıfırla" butonu |

---

## 13. Kenar durumlar (edge case'ler)

### Türkçe karakterler

| Girdi | `toLowerCase()` | `toLocaleLowerCase('tr-TR')` |
|---|---|---|
| `I` | `i` ❌ | `ı` ✅ |
| `İ` | `i̇` (i + birleşik nokta) ❌ | `i` ✅ |

Örnek: `"HALI"` araması.
- `toLowerCase()` ile `"hali"` aranır, `"halı"` bulunamaz.
- `tr-TR` ile eşleşir.

Arama, aynı ürün kontrolü ve kategori eşleştirme **aynı `normalizeText` fonksiyonunu** kullandığı için hepsi tutarlıdır.

### Arama ve filtreleme

| Durum | Davranış |
|---|---|
| Sadece boşluk (`"   "`) | `trim` sonrası `''` olur, filtre uygulanmaz. |
| Eşit fiyatlı kayıtlar | Kararlı `sort` ile orijinal sıraları korunur. |
| Hiç sonuç yok | Tablo yerine `EmptyState`; özet kartları `0`. |

### Silme

| Durum | Davranış |
|---|---|
| Seçili kategorinin son kaydı silinir | Kategori dropdown'dan kalkar, `activeCategory` "Tümü"ye düşer. Ekran açıklamasız boş kalmaz. |
| Tüm kayıtlar silinir | `EmptyState` + özet `0`. Sonraki eklemede `getNextId([])` → `1`. |
| Silme sonrası ekleme | `getNextId` en büyük id + 1 kullanır, id çakışması olmaz. |
| Yanlışlıkla silme | `window.confirm` onayı ister. |

### Ekleme

| Durum | Davranış |
|---|---|
| Boş form gönderimi | Dört alanın hatası birlikte gösterilir. |
| `" Tablet "` | `trim` ile `"Tablet"` olarak kaydedilir. |
| `"   "` (sadece boşluk) ürün adı | "Ürün adı zorunludur." |
| Negatif / sıfır fiyat | "Birim fiyat 0’dan büyük olmalıdır." |
| `1.5` adet | "Adet en az 1 olan bir tam sayı olmalıdır." |
| `"LAPTOP"` + `"elektronik"` | "Bu kategoride aynı isimde bir ürün zaten var." |
| Aynı isim, farklı kategori | İzin verilir (ör. "Lamba" hem Dekorasyon hem Elektronik olabilir). |
| Kategori `"elektronik"` yazıldı | Mevcut `"Elektronik"` kullanılır; ikinci kategori oluşmaz. |
| Yeni kategori (`"Kırtasiye"`) | Kabul edilir, dropdown'a kendiliğinden eklenir. |
| Aktif bir filtre varken ekleme | Kayıt eklenir. Filtreye uymuyorsa tabloda görünmez (beklenen davranış), filtre kaldırılınca görünür. |

### localStorage

| Durum | Davranış |
|---|---|
| İlk ziyaret (veri yok) | `loadRecords()` → `null` → seed veri. |
| Bozuk JSON | `JSON.parse` hatası yakalanır → seed veri. |
| Yapısı yanlış veri | `isSalesRecord` reddeder → seed veri. |
| Gizli sekme / engelli depolama | `try/catch` → uygulama bellekte çalışır. |
| Kota dolu | `saveRecords` hatayı yutar, uygulama çalışmaya devam eder. |
| `StrictMode` effect'i iki kez çalıştırır | `saveRecords` idempotenttir; aynı veriyi iki kez yazmak zararsız. |

---

## 14. Stil ve erişilebilirlik

### Stil

- **CSS Modules:** `.card` → derlemede `_card_x7k2a` gibi benzersiz bir isim. Bileşenler arası çakışma olmaz.
- **CSS değişkenleri (`index.css`):** Renkler (`--color-primary`, `--color-danger`...) ve köşe yuvarlaklıkları tek yerde tanımlı.
- **Responsive:**
  - Özet kartları: 3 sütun, `640px` altında 1 sütun.
  - Form: 5 sütun, `800px` altında 2 sütun, `480px` altında 1 sütun.
  - Filtre çubuğu ve başlık: `flex-wrap` ile dar ekranda alt alta geçer.
  - Tablo: `overflow-x: auto` sarmalayıcı. Mobilde sayfa değil, yalnızca tablo kayar.
- **Sayılar:** Sağa hizalı ve `font-variant-numeric: tabular-nums` ile. Basamaklar alt alta hizalanır.

### Erişilebilirlik

| Özellik | Nerede? |
|---|---|
| Her kontrol bir `<label>` ile ilişkili | Filtreler (`<label>` sarmalayıcı), form (`htmlFor`/`id`) |
| `aria-invalid` + `aria-describedby` | Form input'ları: hatalı alan ve hata metni ekran okuyucuya bildirilir |
| `role="alert"` | Form hata mesajları |
| `role="status"` | `EmptyState` |
| `aria-label` | "Sil" butonları (`"Laptop kaydını sil"`), bölümler |
| Görünmez tablo başlığı | İşlemler sütunu (`visuallyHidden`) |
| `:focus-visible` çerçevesi | Butonlar: klavyeyle gezinmede odak görünür |
| Semantik HTML | `main`, `header`, `section`, `article`, `form`, `table`/`thead`/`tbody` |
| `lang="tr"` | `index.html`: ekran okuyucu Türkçe telaffuz eder |

---

## 15. Yapılandırma değişiklikleri

| Dosya | Değişiklik | Neden |
|---|---|---|
| `tsconfig.app.json` | `"resolveJsonModule": true` | TypeScript'in `.json` import edip tipini çıkarabilmesi için. |
| `index.html` | `lang="tr"`, `<title>Mini Satış Paneli</title>` | Dil bilgisi ve sayfa başlığı. |
| `package.json` | `name: "mini-sales-dashboard"` | Şablondan gelen geçici isim düzeltildi. |
| Vite şablon dosyaları | `App.css`, `assets/`, `icons.svg` silindi | Kullanılmayan boilerplate. |
| `sales-data.json` | Kökten `src/data/` altına taşındı | Kaynak kodla birlikte import edilebilmesi için. |

---

## 16. Doğrulama

Mantık fonksiyonları tarayıcı olmadan doğrudan çalıştırılarak kontrol edildi. `npm run build` (TypeScript tip kontrolü dahil) ve `npm run lint` hatasız geçiyor.

### Şartname senaryoları

| Senaryo | Beklenen | Sonuç |
|---|---|---|
| Filtre yok | 10 kayıt, 25 adet, 98.900 TL | ✅ |
| Kategori: Mobilya | 3 kayıt, 4 adet, 32.500 TL | ✅ |
| Arama: `lap` / `LAP` | Yalnızca Laptop | ✅ |
| Elektronik + `mouse` | Yalnızca Mouse | ✅ |
| Eşleşmeyen arama | Boş durum, özetler 0 | ✅ |
| Arama: `HALI` | Halı | ✅ |
| Fiyat artan / azalan / varsayılan | 700→15.000 / 15.000→700 / id 1…10 | ✅ |

### Bonus senaryoları

| Senaryo | Beklenen | Sonuç |
|---|---|---|
| Boş form | 4 alan için zorunlu alan hatası | ✅ |
| Fiyat `-5`, adet `1.5` | Fiyat ve adet hataları | ✅ |
| `LAPTOP` + `elektronik` | Aynı ürün hatası | ✅ |
| Geçerli kayıt (`" Tablet "`, 7500, 2) | Hata yok, `"Tablet"` olarak trim'lenir | ✅ |
| Ekleme | 11 kayıt, yeni id = 11 | ✅ |
| Boş listede `getNextId` | `1` | ✅ |
| id=1 silme | Kalan id'ler 2…11 | ✅ |
| localStorage boş | `loadRecords()` → `null` | ✅ |
| Kaydet → oku | 11 kayıt geri okunur | ✅ |
| Bozuk JSON | `null` (seed veriye düşer) | ✅ |
| Yapısı yanlış veri | `null` (seed veriye düşer) | ✅ |

---

## 17. Karşılaşılan sorunlar

1. **Vite boş olmayan klasöre kurulum yapmıyor.** Repo zaten `.git` ve `sales-data.json` içeriyordu. Çözüm: şablon geçici bir klasöre kuruldu, dosyalar köke taşındı, geçici klasör silindi.
2. **`git mv` başarısız oldu.** `sales-data.json` henüz commit edilmemişti (untracked). Çözüm: normal `mv`.
3. **JSON import için tip desteği.** TypeScript'in tipi çıkarabilmesi için `resolveJsonModule` gerekti.
4. **`normalize` fonksiyonunun paylaşılması.** Başta `salesFilters.ts` içinde özeldi. Doğrulama da aynı Türkçe kuralına ihtiyaç duyunca `utils/text.ts`'e taşındı.
5. **Büyük/küçük harf farklı kategori sorunu.** `"elektronik"` yazılınca ikinci bir kategori oluşuyordu. `resolveCategory` ile mevcut yazıma eşleştirildi.
6. **Silinen kategorinin seçili kalması.** Son ürünü silinen kategori seçiliyken ekran açıklamasız boş kalıyordu. Türetilmiş `activeCategory` ile "Tümü"ye düşülüyor.
7. **`addRecord` isim çakışması.** Hem saf fonksiyon (`utils/records.ts`) hem hook aksiyonu aynı adı istiyordu. Hook içinde `add` olarak tanımlanıp dışarıya `addRecord` adıyla açıldı.

---

## 18. Fonksiyon dizini (hızlı başvuru)

| Fonksiyon | Dosya | Tür | Tek cümlelik açıklama |
|---|---|---|---|
| `normalizeText` | `utils/text.ts` | saf | Trim + Türkçe küçük harf. |
| `formatCurrency` | `utils/format.ts` | saf | Sayıyı `₺98.900` biçimine çevirir. |
| `formatNumber` | `utils/format.ts` | saf | Sayıyı `1.250` biçimine çevirir. |
| `getRecordTotal` | `utils/salesFilters.ts` | saf | `price × quantity`. |
| `getCategories` | `utils/salesFilters.ts` | saf | Benzersiz kategori listesi. |
| `filterRecords` | `utils/salesFilters.ts` | saf | Arama **ve** kategoriye göre filtreler. |
| `sortRecords` | `utils/salesFilters.ts` | saf | Fiyata göre kopyalayarak sıralar; `default`'ta dokunmaz. |
| `calculateSummary` | `utils/salesFilters.ts` | saf | Toplam tutar, kayıt sayısı, toplam adet. |
| `getNextId` | `utils/records.ts` | saf | En büyük id + 1 (boş listede 1). |
| `addRecord` | `utils/records.ts` | saf | Id atayıp sona ekler, yeni dizi döndürür. |
| `removeRecord` | `utils/records.ts` | saf | Id'ye göre çıkarır, yeni dizi döndürür. |
| `isDuplicate` | `utils/validateRecord.ts` | saf (özel) | Aynı kategoride aynı ürün var mı? |
| `validateProduct` | `utils/validateRecord.ts` | saf (özel) | Zorunlu, ≤ 50 karakter, tekrar yok. |
| `validateCategory` | `utils/validateRecord.ts` | saf (özel) | Zorunlu. |
| `validatePrice` | `utils/validateRecord.ts` | saf (özel) | Zorunlu, sayı, > 0. |
| `validateQuantity` | `utils/validateRecord.ts` | saf (özel) | Zorunlu, tam sayı, ≥ 1. |
| `validateRecord` | `utils/validateRecord.ts` | saf | Yalnızca hatalı alanları içeren obje döndürür. |
| `hasErrors` | `utils/validateRecord.ts` | saf | Hata objesi boş değil mi? |
| `resolveCategory` | `utils/validateRecord.ts` | saf (özel) | Yazılan kategoriyi mevcut yazıma eşler. |
| `toNewRecord` | `utils/validateRecord.ts` | saf | Form değerlerini `NewSalesRecord`'a çevirir. |
| `isSalesRecord` | `utils/recordStorage.ts` | type guard (özel) | Değer gerçekten bir `SalesRecord` mı? |
| `loadRecords` | `utils/recordStorage.ts` | yan etkili | localStorage'dan güvenli okuma; yoksa `null`. |
| `saveRecords` | `utils/recordStorage.ts` | yan etkili | localStorage'a güvenli yazma. |
| `useSalesRecords` | `hooks/useSalesRecords.ts` | hook | Kayıt state'i + ekle/sil/sıfırla + kalıcılık. |
| `useSalesDashboard` | `hooks/useSalesDashboard.ts` | hook | Filtre state'i + türetilmiş veriler. |
| `App` | `App.tsx` | bileşen | Sayfa düzeni. |
| `handleDelete` | `App.tsx` | handler | Onay ister, kaydı siler. |
| `handleReset` | `App.tsx` | handler | Onay ister, başlangıç verisine döner. |
| `AddRecordForm` | `components/AddRecordForm/` | bileşen | Yeni kayıt formu. |
| `handleChange` | `AddRecordForm.tsx` | handler | Tek handler ile tüm alanları günceller, alan hatasını temizler. |
| `handleSubmit` | `AddRecordForm.tsx` | handler | Doğrular; geçerliyse ekler ve formu sıfırlar. |
| `inputProps` | `AddRecordForm.tsx` | yardımcı | Input'ların ortak özelliklerini üretir. |
| `FormField` | `components/AddRecordForm/` | bileşen | Etiket + input + hata mesajı. |
| `Button` | `components/Button/` | bileşen | Varyantlı, varsayılanı `type="button"` olan buton. |
| `FilterBar` | `components/FilterBar/` | bileşen | Üç filtre kontrolünü birleştirir. |
| `SearchInput` | `components/SearchInput/` | bileşen | Kontrollü arama kutusu. |
| `CategoryFilter` | `components/CategoryFilter/` | bileşen | "Tümü" + kategoriler. |
| `SortSelect` | `components/SortSelect/` | bileşen | Sıralama seçimi. |
| `SummaryCards` | `components/SummaryCards/` | bileşen | Üç özet kartı. |
| `SummaryCard` | `components/SummaryCards/` | bileşen | Tek özet kartı. |
| `SalesTable` | `components/SalesTable/` | bileşen | Tablo. |
| `SalesTableRow` | `components/SalesTable/` | bileşen | Tek satır + "Sil" butonu. |
| `EmptyState` | `components/EmptyState/` | bileşen | Boş sonuç mesajı. |
