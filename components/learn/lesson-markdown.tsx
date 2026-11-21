import Markdown, { type Components } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { isHttpsUrl } from "@/lib/validation/common";

// Lesson Markdown (PRD F-LRN-03): headings, paragraphs, lists, images, highlighted code and
// callouts (a blockquote). Raw HTML in the Markdown is not rendered (react-markdown's default).

const components: Components = {
  // The lesson's "# Title" is the page heading.
  h1: ({ children }) => (
    <h1 className="text-2xl font-semibold tracking-tight text-balance text-ink-strong">
      {children}
    </h1>
  ),
  h2: ({ children }) => <h2 className="mt-4 text-lg font-semibold text-ink-strong">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-3 font-semibold text-ink-strong">{children}</h3>,
  p: ({ children }) => <p className="leading-7 text-ink">{children}</p>,
  ul: ({ children }) => (
    <ul className="flex list-disc flex-col gap-1.5 pl-5 leading-7">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="flex list-decimal flex-col gap-1.5 pl-5 leading-7 marker:font-mono marker:text-ink-3">
      {children}
    </ol>
  ),
  strong: ({ children }) => <strong className="font-semibold text-ink-strong">{children}</strong>,
  a: ({ href, children }) =>
    href && isHttpsUrl(href) ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-primary underline underline-offset-2 hover:text-primary-hover"
      >
        {children}
      </a>
    ) : (
      <span>{children}</span>
    ),
  blockquote: ({ children }) => (
    <aside className="rounded-lg border border-primary-200 bg-wash px-4 py-3 text-sm text-ink-2 [&_p]:text-ink-2">
      {children}
    </aside>
  ),
  img: ({ src, alt }) =>
    typeof src === "string" && isHttpsUrl(src) ? (
      // Lesson images can come from anywhere https, so a plain img avoids remote config.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt ?? ""} loading="lazy" className="rounded-lg border border-line" />
    ) : null,
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-lg border border-line bg-surface-2 p-4 font-mono text-[13px] leading-6">
      {children}
    </pre>
  ),
  code: ({ className, children }) => (
    <code
      className={
        className?.includes("hljs")
          ? className
          : "rounded-sm bg-surface-2 px-1 py-0.5 font-mono text-[0.9em] text-ink-strong"
      }
    >
      {children}
    </code>
  ),
  hr: () => <hr className="border-line" />,
};

export function LessonMarkdown({ children }: { children: string }) {
  return (
    <div className="flex flex-col gap-4">
      <Markdown components={components} rehypePlugins={[[rehypeHighlight, { detect: false }]]}>
        {children}
      </Markdown>
    </div>
  );
}
