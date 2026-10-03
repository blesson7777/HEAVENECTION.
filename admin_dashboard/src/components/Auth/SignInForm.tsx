"use client";
import { FormEvent, useState } from "react";
export default function SignInForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setPending(true); setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: values.get("email"), password: values.get("password") }), signal: AbortSignal.timeout(15000) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Sign in failed");
      window.location.assign(result.destination);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to sign in"); setPending(false); }
  }
  return <form onSubmit={submit}>
    <div className="mb-4"><label htmlFor="email" className="mb-2.5 block font-medium text-black dark:text-white">Email</label>
      <input id="email" name="email" type="email" autoComplete="username" required maxLength={254} className="w-full rounded-lg border border-stroke bg-transparent px-6 py-4 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input" /></div>
    <div className="mb-6"><label htmlFor="password" className="mb-2.5 block font-medium text-black dark:text-white">Password</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required maxLength={128} className="w-full rounded-lg border border-stroke bg-transparent px-6 py-4 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input" /></div>
    {error && <p role="alert" className="mb-4 text-danger">{error}</p>}
    <button disabled={pending} type="submit" className="w-full rounded-lg border border-primary bg-primary p-4 text-white disabled:opacity-50">{pending ? "Signing in..." : "Sign In"}</button>
    <p className="mt-6 text-center text-sm">Contact your administrator to get an account.</p>
  </form>;
}
