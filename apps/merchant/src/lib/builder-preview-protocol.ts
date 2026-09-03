/**
 * Message-type constants shared between the Store Builder
 * (components/builder/store-builder.tsx, both the embedded <iframe> and the
 * "Live Preview" new-tab button) and the page it talks to
 * (app/builder-preview-frame/page.tsx). Kept in one place so the two sides
 * can't drift — a typo'd string literal on either end would otherwise fail
 * silently (a postMessage nobody's listening for), not with a type error.
 */
export const BUILDER_PREVIEW_READY = "ecomstrait:builder-preview:ready";
export const BUILDER_PREVIEW_DATA = "ecomstrait:builder-preview:data";
export const BUILDER_PREVIEW_HEIGHT = "ecomstrait:builder-preview:height";
