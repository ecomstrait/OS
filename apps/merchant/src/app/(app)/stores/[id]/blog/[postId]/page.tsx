import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@ecomstrait/auth/server";
import { getPost } from "@/lib/blog-actions";
import { PostEditor } from "@/components/blog/post-editor";

export const metadata: Metadata = { title: "Edit post" };

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string; postId: string }>;
}) {
  const { id, postId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("id, live_url")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!store) notFound();

  const post = await getPost(id, postId);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PostEditor storeId={id} storeLiveUrl={store.live_url} post={post} />
    </div>
  );
}
