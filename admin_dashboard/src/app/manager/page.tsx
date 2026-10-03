import type { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import ECommerce from "@/components/Dashboard/E-commerce";
export const metadata: Metadata = { title: "Manager Dashboard | Heavenection" };
export default function ManagerDashboard() {
  return <DefaultLayout><h1 className="mb-2 text-title-md font-bold text-black dark:text-white">Manager Dashboard</h1><p className="mb-6">Dashboard preview: sample data until business modules are connected.</p><ECommerce /></DefaultLayout>;
}
