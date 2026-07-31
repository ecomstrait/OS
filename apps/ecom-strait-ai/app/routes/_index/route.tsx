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

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <p className={styles.eyebrow}>EcomStrait · Beta</p>
        <h1 className={styles.heading}>Sell verified suppliers&apos; products on Shopify</h1>
        <p className={styles.text}>
          Browse a catalog of products from verified suppliers, add them to your store in a click,
          and let EcomStrait keep pricing, images and stock in sync. Your supplier ships the order —
          you keep the margin.
        </p>

        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Install on your store</span>
              <input
                className={styles.input}
                type="text"
                name="shop"
                placeholder="my-shop-domain.myshopify.com"
              />
              <span>Enter your Shopify store domain</span>
            </label>
            <button className={styles.button} type="submit">
              Install app
            </button>
          </Form>
        )}

        <ul className={styles.list}>
          <li>
            <strong>Discover products</strong>. Browse verified suppliers by niche, with retail
            price, cost and margin shown on every product before you commit.
          </li>
          <li>
            <strong>One-click listing</strong>. Adding a product sends it to the supplier for
            approval, then it syncs into your store with images, pricing and live stock.
          </li>
          <li>
            <strong>No inventory, no risk</strong>. You never hold stock. The supplier fulfils each
            order and stock levels update automatically on both sides.
          </li>
          <li>
            <strong>Built by EcomAI</strong>. Let our AI co-founder pick a niche, choose the
            products and build the storefront — or do it yourself.
          </li>
        </ul>

        <p className={styles.footnote}>
          EcomStrait is in beta — the full version launches soon.{" "}
          <a className={styles.link} href="https://ecomstrait.com" target="_blank" rel="noreferrer">
            Learn more at ecomstrait.com
          </a>
        </p>
      </div>
    </div>
  );
}
