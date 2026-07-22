/** Minimal RFC-4180-ish CSV parser (quotes, escaped quotes, CRLF). No deps. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** Fields the importer can map, with header aliases for auto-detection. */
export const IMPORT_FIELDS: { key: string; label: string; aliases: string[]; required?: boolean }[] = [
  { key: "title", label: "Title", aliases: ["title", "name", "product", "productname"], required: true },
  { key: "description", label: "Description", aliases: ["description", "desc", "details"] },
  { key: "category", label: "Category", aliases: ["category", "cat", "type"] },
  { key: "sku", label: "SKU", aliases: ["sku", "code"] },
  { key: "wholesale_price", label: "Wholesale price", aliases: ["wholesale", "wholesaleprice", "cost"] },
  { key: "retail_price", label: "Retail price", aliases: ["retail", "retailprice", "price", "rrp", "msrp"] },
  { key: "stock", label: "Stock", aliases: ["stock", "quantity", "qty", "inventory"] },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Auto-map field → column index by matching header aliases. */
export function autoMap(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  const normed = headers.map(norm);
  for (const f of IMPORT_FIELDS) {
    const idx = normed.findIndex((h) => f.aliases.includes(h));
    map[f.key] = idx;
  }
  return map;
}
