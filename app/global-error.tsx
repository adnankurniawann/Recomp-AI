"use client";

import "./globals.css";

/**
 * Last resort when the root layout itself fails. It replaces the whole document, so it brings its
 * own <html> and keeps to plain markup and the tokens in globals.css.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="id">
      <body className="flex min-h-dvh items-center justify-center bg-bg px-4 font-sans text-ink">
        <main
          role="alert"
          className="flex max-w-sm flex-col items-center gap-3 rounded-xl border border-line bg-surface px-6 py-10 text-center"
        >
          <p className="font-medium text-ink-strong">Recomp AI sedang bermasalah</p>
          <p className="text-sm text-ink-3">Periksa koneksimu, lalu coba lagi sebentar lagi.</p>
          <button
            type="button"
            onClick={reset}
            className="mt-1 inline-flex h-11 items-center justify-center rounded-md border border-line bg-surface px-4 text-sm font-medium text-ink shadow-xs hover:border-line-strong focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:outline-none md:h-10"
          >
            Coba lagi
          </button>
        </main>
      </body>
    </html>
  );
}
