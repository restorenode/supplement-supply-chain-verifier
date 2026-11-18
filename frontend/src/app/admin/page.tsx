import type { Metadata } from "next";
import AdminClient from "@/app/admin/AdminClient";

export const metadata: Metadata = {
  title: "Publisher console"
};

export default function AdminPage() {
  return <AdminClient />;
}
