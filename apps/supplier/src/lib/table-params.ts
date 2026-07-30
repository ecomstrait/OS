/**
 * Table `?q=` / `?page=` helpers. The implementation lives in @ecomstrait/ui so
 * the merchant portal shares it; this re-export keeps the existing
 * `@/lib/table-params` import path working across the supplier pages.
 */
export {
  PAGE_SIZE,
  sanitizeSearch,
  likeTerm,
  parseTableParams,
  pageCount,
  clampPage,
  pageSlice,
  type RawParams,
  type TableQuery,
} from "@ecomstrait/ui";
