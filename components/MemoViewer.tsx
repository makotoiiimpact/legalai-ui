"use client";

import ReactMarkdown from "react-markdown";

export default function MemoViewer({ content }: { content: string }) {
  return (
    <article className="prose prose-slate max-w-none text-[15px] leading-relaxed prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-lg prose-h2:mt-6 prose-p:text-slate-800 prose-strong:text-slate-900 prose-li:text-slate-800">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-semibold text-slate-900 mt-0 mb-4">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-semibold uppercase tracking-wider text-slate-500 mt-6 mb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-slate-900 mt-4 mb-1">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-sm leading-relaxed text-slate-800 my-2">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-800 my-2">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 space-y-1 text-sm text-slate-800 my-2">
              {children}
            </ol>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-900">{children}</strong>
          ),
          hr: () => <hr className="my-6 border-slate-200" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
