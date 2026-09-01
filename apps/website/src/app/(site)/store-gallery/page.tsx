import { redirect } from "next/navigation";
import { merchantSignupUrl } from "@/lib/site";

// Store Gallery is hidden for now — listing the generated stores would reveal
// how EcomAI builds them. Any visit is redirected to the merchant signup
// (the homepage AI builder demo it used to point to is also hidden for now).
export default function StoreGalleryPage() {
  redirect(merchantSignupUrl);
}
