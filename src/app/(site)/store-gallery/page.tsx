import { redirect } from "next/navigation";

// Store Gallery is hidden for now — listing the generated stores would reveal
// how EcomAI builds them. Any visit is redirected to the homepage builder.
export default function StoreGalleryPage() {
  redirect("/#builder");
}
