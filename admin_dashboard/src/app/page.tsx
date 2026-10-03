import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import ECommerce from "@/components/Dashboard/E-commerce";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";

export const metadata: Metadata = {
  title:
    "E-commerce Dashboard | Heavenection",
  description: "Heavenection Home page",
};

export default async function Home() {
  const user = await requireUser();
  if (user.role === "MANAGER") redirect("/manager");
  return (
    <>
      <DefaultLayout>
        <h1 className="mb-2 text-title-md font-bold text-black dark:text-white">Admin Dashboard</h1>
        <p className="mb-6">Dashboard preview: sample data until business modules are connected.</p>
        <ECommerce />
      </DefaultLayout>
    </>
  );
}
