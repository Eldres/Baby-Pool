import type { Metadata } from "next";
import AdminPanel from "@/components/AdminPanel";

export const metadata: Metadata = {
  title: "Admin | Baby Guessing Pool",
  description: "Admin panel for managing baby pool settings and results.",
};

export default function AdminPage() {
  return <AdminPanel />;
}
