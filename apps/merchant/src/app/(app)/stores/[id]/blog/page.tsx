import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@ecomstrait/auth/server";
import { listPosts } from "@/lib/blog-actions";
import { BlogManager } from "@/components/blog/blog-manager";

export const metadata: Metadata = { title: "Blog" };

export default async function StoreBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, live_url")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!store) notFound();

  const posts = await listPosts(id);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-950">Blog — {store.name}</h1>
        <p className="mt-1 text-sm text-ink-500">
          Write a post yourself, or ask AI to draft one from a topic — either way, review it here before it goes live.
        </p>
      </div>
      <BlogManager storeId={id} storeLiveUrl={store.live_url} initialPosts={posts} />
    </div>
  );
}
