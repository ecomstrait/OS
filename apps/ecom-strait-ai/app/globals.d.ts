declare module "*.css";

/**
 * `s-app-nav` is an App Bridge element, not a Polaris one, so it isn't part of
 * the `@shopify/polaris-types` JSX declarations. Declared here so the app nav
 * in app.tsx typechecks.
 */
declare namespace JSX {
  interface IntrinsicElements {
    "s-app-nav": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
  }
}
