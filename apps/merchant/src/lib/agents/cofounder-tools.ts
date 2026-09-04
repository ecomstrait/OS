import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createClient } from "@ecomstrait/auth/server";
import type { StoreType } from "@ecomstrait/db";
import { autoSelectProducts, getProductsByIds } from "@/lib/catalog";
import { suggestProductsForStore } from "@/lib/product-suggestions";
import { generateStorePlan, themeForStyle, type PlanAnswers, type StorePlan } from "@/lib/ecomai";
import { ensureDraftStore, launchStoreCore, editStore } from "@/lib/builder-actions";
import { assertTokenBudget, recordTokenUsage } from "@/lib/entitlements";
import { askBusinessAdvisor } from "./business-advisor";

/**
 * The tools that make Co-Founder an orchestrator rather than a chat that
 * only reasons over a static snapshot — each one IS a specialist the user
 * asked for: `suggest_products` is the Product Consultant, `build_store` /
 * `launch_store` / `edit_store_content` are the Website Builder (SEO is a
 * flavor of `edit_store_content`, same as it already is in the builder
 * chat's own intent classification — see `ecomai.ts`'s `MERCHANT_SYSTEM`),
 * and `ask_business_advisor` delegates to the existing tool-calling
 * Business Advisor agent for a deep, grounded read on one specific store.
 *
 * Every tool closes over `tenantId` — never accepts it as a model-supplied
 * argument — and otherwise reuses the exact same session-authenticated,
 * ownership-checked functions the human-driven UI already calls (no new
 * auth logic invented here). See `cofounder-orchestrator.ts` for how these
 * get assembled into the actual agent.
 */
export function createCofounderTools(opts: { tenantId: string }) {
  const listMyStores = tool(
    async () => {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return "Not authenticated.";
      const { data } = await supabase
        .from("stores")
        .select("id, name, type, status, theme, launched_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!data?.length) return "This merchant has no stores yet — not even an unlaunched draft.";
      return JSON.stringify(
        data.map((s) => ({
          id: s.id,
          name: s.name ?? "Untitled",
          type: s.type,
          status: s.status,
          theme: s.theme,
          launched: Boolean(s.launched_at),
        })),
      );
    },
    {
      name: "list_my_stores",
      description:
        "List this merchant's own stores (id, name, type, status, whether it's launched or still a draft). Call this first whenever a request mentions 'my store' or names one, to resolve which storeId the other tools need.",
      schema: z.object({}),
    },
  );

  const suggestProducts = tool(
    async ({ category, storeId, limit }: { category?: string; storeId?: string; limit?: number }) => {
      let excludeIds: string[] = [];
      if (storeId) {
        const supabase = await createClient();
        const { data } = await supabase.from("store_products").select("product_id").eq("store_id", storeId);
        excludeIds = (data ?? []).map((r) => r.product_id);
      }
      const suggested = await suggestProductsForStore({
        category: category ?? null,
        excludeIds,
        limit: limit ?? 6,
      });
      if (!suggested.products.length) return "No matching products found on the platform right now.";
      return JSON.stringify({
        // False means the requested category matched nothing and these are
        // genuine platform-wide results instead — say so plainly if you
        // relay these, never present them as if they were the category
        // asked for.
        matchedCategory: suggested.matchedCategory,
        requestedCategory: suggested.requestedCategory,
        products: suggested.products.map((p) => ({
          id: p.id,
          title: p.title,
          category: p.category,
          retailPrice: p.retail_price,
          unitsSold: p.unitsSold,
          marginPct: p.marginPct,
          reason: p.reason,
        })),
      });
    },
    {
      name: "suggest_products",
      description:
        "Suggest real, ranked products from the platform catalog for the merchant to sell — ranked by actual units sold and margin, never a guess. Use when asked what to sell, for product ideas, or before building a store around a niche. Pass storeId to exclude products already listed there. The result's matchedCategory tells you whether the requested category actually had matches — if false, these are platform-wide fallback picks, not the category asked for, and you must say so plainly rather than presenting them as a match.",
      schema: z.object({
        category: z.string().optional().describe("A niche/category hint, e.g. 'shoes' — omit for platform-wide top sellers"),
        storeId: z.string().optional().describe("Exclude products already listed on this store"),
        limit: z.number().optional().describe("Max results, default 6"),
      }),
    },
  );

  const buildStore = tool(
    async ({
      niche,
      audience,
      styleKeyword,
      storeName,
      productIds,
    }: {
      niche: string;
      audience?: string;
      styleKeyword?: string;
      storeName?: string;
      productIds?: string[];
    }) => {
      const budget = await assertTokenBudget(1500);
      if (!budget.ok) return budget.error;

      const products = productIds?.length ? await getProductsByIds(productIds) : await autoSelectProducts(niche, 8);
      if (!products.length) {
        return "Couldn't find any published products to build this store around — try suggest_products first, or a different niche.";
      }

      const answers: PlanAnswers = {
        niche,
        audience: audience ?? null,
        styleKeyword: styleKeyword ?? null,
        storeName: storeName ?? null,
      };
      const { plan, tokensUsed } = await generateStorePlan(
        answers,
        products.map((p) => p.title),
      );
      await recordTokenUsage(tokensUsed);
      const theme = themeForStyle(styleKeyword);

      const draft = await ensureDraftStore({
        name: plan.storeName,
        theme,
        plan,
        products: products.map((p) => ({ id: p.id, price: p.retail_price })),
      });
      if (draft.error || !draft.storeId) return `Couldn't create the store: ${draft.error ?? "unknown error"}`;

      return JSON.stringify({
        storeId: draft.storeId,
        reviewUrl: `/builder?draft=${draft.storeId}`,
        storeName: plan.storeName,
        tagline: plan.tagline,
        theme,
        productCount: products.length,
        note: "This is a real, saved draft — not live yet. Call launch_store with this storeId only if the merchant explicitly wants it live now.",
      });
    },
    {
      name: "build_store",
      description:
        "Build a real store around an idea: generates a full store plan (name, tagline, colors, hero copy, SEO) and saves it as a genuine draft the merchant can open and review. Pass productIds from a prior suggest_products call to build around specific picks, or omit it to auto-pick products for the niche. Does NOT make the store live — call launch_store separately for that.",
      schema: z.object({
        niche: z.string().describe("What the store sells, e.g. 'handmade leather bags'"),
        audience: z.string().optional().describe("Who buys it / where"),
        styleKeyword: z.string().optional().describe("Visual vibe, e.g. 'luxury', 'playful', 'minimal'"),
        storeName: z.string().optional().describe("Store name, if the merchant gave one"),
        productIds: z.array(z.string()).optional().describe("Specific product ids to build around"),
      }),
    },
  );

  const launchStore = tool(
    async ({ storeId }: { storeId: string }) => {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return "Not authenticated.";
      const { data: store } = await supabase
        .from("stores")
        .select("id, name, type, theme, logo_url, content, draft_products, launched_at")
        .eq("id", storeId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!store) return "Store not found, or it doesn't belong to this merchant.";
      if (store.launched_at) return "This store is already live.";

      const result = await launchStoreCore({
        draftId: store.id,
        name: store.name ?? "My Store",
        type: store.type as StoreType,
        theme: store.theme ?? "aurora",
        logoUrl: store.logo_url,
        plan: store.content as unknown as StorePlan,
        products: (store.draft_products ?? []) as { id: string; price: number | null }[],
      });
      if ("error" in result) return `Couldn't launch: ${result.error}`;
      return JSON.stringify({ storeId: result.storeId, liveUrl: result.liveUrl, note: "The store is now live." });
    },
    {
      name: "launch_store",
      description:
        "Make a draft store live. Only call this when the merchant explicitly asks for the store to go live or be published — never automatically right after building it.",
      schema: z.object({ storeId: z.string() }),
    },
  );

  const editStoreContent = tool(
    async ({ storeId, instruction }: { storeId: string; instruction: string }) => {
      const result = await editStore(storeId, instruction);
      if (result.error) return result.error;
      if (result.productSuggestions?.length) {
        return JSON.stringify({
          note: result.note,
          productSuggestions: result.productSuggestions.map((p) => ({
            id: p.id,
            title: p.title,
            retailPrice: p.retail_price,
          })),
        });
      }
      return result.note ?? "Done.";
    },
    {
      name: "edit_store_content",
      description:
        "Edit an existing store's own content — headline, tagline, brand colors, about text, SEO title/description, collections, announcement bar, footer, or a whole custom page (Contact Us, FAQ, etc). Also the right tool for SEO analysis/improvement requests for this store. Give the full instruction in plain English, e.g. 'improve the SEO' or 'make the headline shorter and use a deep green'.",
      schema: z.object({ storeId: z.string(), instruction: z.string() }),
    },
  );

  const askAdvisor = tool(
    async ({ storeId, question }: { storeId: string; question: string }) => {
      const advisor = await askBusinessAdvisor({ tenantId: opts.tenantId, storeId, message: question });
      return advisor.reply;
    },
    {
      name: "ask_business_advisor",
      description:
        "Get a real, grounded answer about ONE specific store's own numbers, orders, catalog, or (for a connected Shopify store) live shop status — has direct read access to that store's actual data. Use for a deep or precise question about one named store, not a portfolio-wide question (the snapshot already covers those).",
      schema: z.object({ storeId: z.string(), question: z.string() }),
    },
  );

  return [listMyStores, suggestProducts, buildStore, launchStore, editStoreContent, askAdvisor];
}
