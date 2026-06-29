"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#070b16] text-white">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-bold">Something went wrong</h2>
          <p className="mt-2 text-slate-400">An unexpected error occurred. Our team has been notified.</p>
          <button
            onClick={reset}
            className="mt-6 rounded-lg bg-blue-500 px-5 py-2.5 font-medium text-white hover:bg-blue-400"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
