import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { redirect, Form, useLoaderData } from "react-router";

import { login } from "../../shopify.server";

import styles from "./styles.module.css";

/**
 * Public landing page for the EcomStrait Shopify app.
 *
 * Only reached outside Shopify admin — a merchant arriving with `?shop=` is
 * sent straight to the embedded app. Copy mirrors the marketing site so the
 * story matches wherever someone lands.
 */

export const meta: MetaFunction = () => [
  { title: "EcomStrait — sell verified suppliers' products on Shopify" },
  {
    name: "description",
    content:
      "Add products from verified EcomStrait suppliers to your Shopify store. Pricing, images and stock sync automatically. Your supplier ships; you sell.",
  },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

const FEATURES = [
  {
    title: "Discover products",
    body: "Browse verified suppliers by niche, with retail price, cost and margin shown on every product before you commit.",
  },
  {
    title: "One-click listing",
    body: "Adding a product sends it to the supplier for approval, then it syncs into your store with images, pricing and live stock.",
  },
  {
    title: "No inventory, no risk",
    body: "You never hold stock. The supplier fulfils each order and stock levels update automatically on both sides.",
  },
  {
    title: "Built by EcomAI",
    body: "Let our AI co-founder pick a niche, choose the products and build the storefront — or do it yourself.",
  },
];

const INSTALL_STEPS = [
  "Enter your Shopify store domain above and click Install app",
  "Review the requested permissions and approve on the Shopify screen",
  "You're in — start browsing verified suppliers from your dashboard",
];

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <span className={styles.wordmark}>EcomStrait</span>
        <span className={styles.badge}>Beta</span>
      </header>

      <main className={styles.hero}>
        <p className={styles.eyebrow}>For Shopify merchants</p>
        <h1 className={styles.heading}>Sell verified suppliers&apos; products on Shopify</h1>
        <p className={styles.text}>
          Browse a catalog of products from verified suppliers, add them to your store in a click,
          and let EcomStrait keep pricing, images and stock in sync. Your supplier ships the order —
          you keep the margin.
        </p>

        {showForm && (
          <div className={styles.installCard}>
            <Form className={styles.form} method="post" action="/auth/login">
              <label className={styles.label} htmlFor="shop">
                Install on your store
              </label>
              <div className={styles.inputRow}>
                <input
                  className={styles.input}
                  id="shop"
                  type="text"
                  name="shop"
                  placeholder="my-shop-domain.myshopify.com"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button className={styles.button} type="submit">
                  Install app
                </button>
              </div>
              <span className={styles.hint}>Enter your Shopify store domain — no https:// needed</span>
            </Form>

            <ol className={styles.steps}>
              {INSTALL_STEPS.map((step, index) => (
                <li key={step} className={styles.step}>
                  <span className={styles.stepNumber}>{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </main>

      <section className={styles.features} aria-label="What EcomStrait does">
        <ul className={styles.list}>
          {FEATURES.map((feature) => (
            <li key={feature.title} className={styles.card}>
              <strong className={styles.cardTitle}>{feature.title}</strong>
              <p className={styles.cardBody}>{feature.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <footer className={styles.footer}>
        <p className={styles.footnote}>
          EcomStrait is in beta — the full version launches soon.{" "}
          <a className={styles.link} href="https://ecomstrait.com" target="_blank" rel="noreferrer">
            Learn more at ecomstrait.com
          </a>
        </p>
      </footer>
    </div>
  );
}
