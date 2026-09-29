import { requireAdminPage } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

/** Every page under this group requires an authenticated admin. */
export default async function AdminConsoleLayout({ children }: { children: React.ReactNode }) {
    const { user } = await requireAdminPage();
    return (
        <div className="cd-admin">
            <AdminSidebar email={user.email ?? ""} />
            <main className="cd-admin-main">{children}</main>
        </div>
    );
}
