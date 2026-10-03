"use client";
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6"><h1 className="text-xl font-bold">Unable to load the dashboard</h1><p>Please check that the backend service is running and try again.</p><button onClick={reset} className="rounded bg-primary px-6 py-3 text-white">Try again</button><a href="/auth/signin">Return to sign in</a></main>;
}
