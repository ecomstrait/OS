"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui";
import { parseCsv, autoMap, IMPORT_FIELDS } from "@/lib/csv";
import { bulkImportProducts, type ProductInput } from "@/lib/product-actions";

export function CsvImport() {
  const router = useRouter();
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File) {
    setError(null);
    setResult(null);
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.length < 2) {
      setError("That file has no data rows.");
      return;
    }
    const [head, ...body] = parsed;
    setHeaders(head);
    setRows(body);
    setMapping(autoMap(head));
  }

  function buildRows(): ProductInput[] {
    return rows.map((r) => {
      const get = (key: string) => {
        const idx = mapping[key];
        return idx != null && idx >= 0 ? (r[idx] ?? "").trim() : "";
      };
      return {
        title: get("title"),
        description: get("description"),
        category: get("category"),
        sku: get("sku"),
        wholesale_price: get("wholesale_price"),
        retail_price: get("retail_price"),
        stock: get("stock"),
        status: "draft",
      };
    });
  }

  async function doImport() {
    setImporting(true);
    setError(null);
    const res = await bulkImportProducts(buildRows());
    setImporting(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setResult(`Imported ${res.imported} product${res.imported === 1 ? "" : "s"}.`);
    router.refresh();
    setTimeout(() => router.push("/catalog"), 900);
  }

  const validRows = rows.filter((r) => {
    const idx = mapping["title"];
    return idx >= 0 && (r[idx] ?? "").trim();
  }).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Upload */}
      <label className="grid cursor-pointer place-items-center rounded-2xl border border-dashed border-ink-300 bg-white p-10 text-center hover:border-ink-400">
        <Upload className="h-6 w-6 text-ink-400" />
        <p className="mt-2 text-sm font-medium text-ink-800">Choose a CSV file</p>
        <p className="text-xs text-ink-400">
          Columns like title, description, category, price, stock are auto-detected.
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
      </label>

      {headers.length > 0 && (
        <>
          {/* Column mapping */}
          <div className="rounded-2xl border border-ink-100 bg-white p-5">
            <h2 className="text-sm font-semibold text-ink-950">Map columns</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {IMPORT_FIELDS.map((f) => (
                <label key={f.key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-ink-600">
                    {f.label}
                    {f.required && <span className="text-red-500"> *</span>}
                  </span>
                  <select
                    value={mapping[f.key] ?? -1}
                    onChange={(e) =>
                      setMapping((m) => ({ ...m, [f.key]: Number(e.target.value) }))
                    }
                    className="h-9 min-w-[9rem] rounded-lg border border-ink-200 bg-white px-2 text-sm outline-none focus:border-brand-400"
                  >
                    <option value={-1}>— none —</option>
                    {headers.map((h, i) => (
                      <option key={i} value={i}>
                        {h || `Column ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
            <div className="border-b border-ink-100 px-4 py-3 text-sm font-semibold text-ink-950">
              Preview · {validRows} product{validRows === 1 ? "" : "s"}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink-400">
                    {IMPORT_FIELDS.map((f) => (
                      <th key={f.key} className="px-4 py-2 font-medium">
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {buildRows()
                    .slice(0, 5)
                    .map((r, i) => (
                      <tr key={i} className="border-t border-ink-50">
                        {IMPORT_FIELDS.map((f) => (
                          <td key={f.key} className="max-w-[12rem] truncate px-4 py-2 text-ink-700">
                            {(r as unknown as Record<string, string>)[f.key] || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {result && (
            <p className="flex items-center gap-2 text-sm font-medium text-brand-700">
              <Check className="h-4 w-4" /> {result}
            </p>
          )}

          <div className="w-48">
            <Button onClick={doImport} disabled={importing || validRows === 0}>
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                `Import ${validRows} product${validRows === 1 ? "" : "s"}`
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
