import type { StoreType } from "@ecomstrait/db";

export type DnsRecord = { type: "A" | "CNAME"; host: string; value: string };

export type DomainTarget = {
  /** Where the merchant configures DNS: Shopify admin, or their registrar → us. */
  provider: "shopify" | "own";
  records: DnsRecord[];
  /** Expected apex A-record IP used to verify the connection. */
  expectedA: string;
  /** Short note shown under the instructions. */
  note: string;
};

// Shopify's fixed storefront endpoints (same for every store).
const SHOPIFY_A = "23.227.38.65";
const SHOPIFY_CNAME = "shops.myshopify.com";

// Own-platform storefront host. Env-overridable so the target follows wherever
// the Path-3 storefront is deployed. Defaults suit a Vercel deployment.
const OWN_A = process.env.STOREFRONT_A_RECORD || "76.76.21.21";
const OWN_CNAME = process.env.STOREFRONT_CNAME || "cname.vercel-dns.com";

/** DNS records + expected values for a store, keyed on its build path. */
export function domainTarget(type: StoreType): DomainTarget {
  if (type === "own_platform") {
    return {
      provider: "own",
      expectedA: OWN_A,
      records: [
        { type: "A", host: "@", value: OWN_A },
        { type: "CNAME", host: "www", value: OWN_CNAME },
      ],
      note: "Add these at your domain registrar. We provision the SSL certificate automatically once DNS resolves.",
    };
  }
  // Both Shopify paths point at Shopify's storefront.
  return {
    provider: "shopify",
    expectedA: SHOPIFY_A,
    records: [
      { type: "A", host: "@", value: SHOPIFY_A },
      { type: "CNAME", host: "www", value: SHOPIFY_CNAME },
    ],
    note: "Add these at your registrar, then connect the domain in Shopify admin → Settings → Domains. It serves once the store is transferred and on a paid plan.",
  };
}

/** Loose hostname check (apex or sub-domain, no scheme/path). */
export function isValidDomain(input: string): boolean {
  const d = input.trim().toLowerCase();
  return /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})+$/.test(d) && d.length <= 253;
}

/** Normalise user input to a bare hostname (strip scheme, www, path, trailing dot). */
export function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[/#?].*$/, "")
    .replace(/\.$/, "");
}
