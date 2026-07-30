import { NextResponse } from "next/server";

/** One error shape across the storefront API, so clients can branch on `error`. */
export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Storefront reads are public but per-customer (cart cookie) — never cached. */
export function apiOk<T>(body: T, init?: { status?: number }) {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: { "Cache-Control": "no-store" },
  });
}

/** Parse a JSON body, returning null rather than throwing on malformed input. */
export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
