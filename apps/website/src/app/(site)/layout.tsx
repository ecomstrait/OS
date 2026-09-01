import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
// Announcement bar's copy ("watch it build a real store in seconds") is
// entirely about the AI Website Builder demo, which is hidden for now.
// import { AnnouncementBar } from "@/components/layout/announcement-bar";

/** Marketing-site chrome. Storefront demos under /store live outside this group. */
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {/* <AnnouncementBar /> */}
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
