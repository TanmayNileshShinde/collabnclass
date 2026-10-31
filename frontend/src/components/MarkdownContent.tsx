import React, { useState, useEffect } from "react";
import { Check, Copy, Code2, Terminal } from "lucide-react";
import { codeToHtml } from "shiki";

interface MarkdownContentProps {
  content: string;
  isUser?: boolean;
}

const normalizeLang = (rawLang: string): string => {
  const l = rawLang.trim().toLowerCase();
  const map: Record<string, string> = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    py: "python",
    python: "python",
    rb: "ruby",
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    shell: "bash",
    json: "json",
    html: "html",
    css: "css",
    scss: "scss",
    c: "c",
    cpp: "cpp",
    "c++": "cpp",
    cs: "csharp",
    "c#": "csharp",
    java: "java",
    go: "go",
    rust: "rust",
    rs: "rust",
    sql: "sql",
    yaml: "yaml",
    yml: "yaml",
    md: "markdown",
    markdown: "markdown",
  };
  return map[l] || (l ? l : "plaintext");
};

const CodeBlock = ({
  code,
  language = "text",
}: {
  code: string;
  language?: string;
}) => {
  const [copied, setCopied] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
  const displayLang = (language || "code").toUpperCase();

  useEffect(() => {
    let isMounted = true;
    const highlight = async () => {
      try {
        const lang = normalizeLang(language);
        const html = await codeToHtml(code, {
          lang,
          theme: "github-dark",
        });
        if (isMounted) setHighlightedHtml(html);
      } catch {
        // fallback language
        try {
          const html = await codeToHtml(code, {
            lang: "plaintext",
            theme: "github-dark",
          });
          if (isMounted) setHighlightedHtml(html);
        } catch {
          if (isMounted) setHighlightedHtml(null);
        }
      }
    };

    highlight();
    return () => {
      isMounted = false;
    };
  }, [code, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code snippet:", err);
    }
  };

  return (
    <div className="my-2.5 rounded-xl overflow-hidden border border-[rgba(0,180,255,0.2)] bg-[#030914] shadow-lg">
      {/* Code Header Bar */}
      <div className="px-3 py-1.5 bg-[#051121] border-b border-[rgba(0,180,255,0.12)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500/70" />
            <span className="w-2 h-2 rounded-full bg-yellow-500/70" />
            <span className="w-2 h-2 rounded-full bg-emerald-500/70" />
          </div>
          <div className="h-3 w-[1px] bg-white/10 mx-0.5" />
          <span className="flex items-center gap-1 text-[10px] font-mono font-semibold tracking-wider text-cyan-300">
            <Terminal className="w-3 h-3 text-cyan-400" />
            {displayLang}
          </span>
        </div>

        <button
          onClick={handleCopy}
          type="button"
          aria-label="Copy code snippet"
          className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/[0.04] hover:bg-cyan-500/20 text-neutral-300 hover:text-cyan-200 border border-white/[0.08] hover:border-cyan-500/40 transition-all duration-150 active:scale-95"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-neutral-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <div className="p-3 overflow-x-auto text-[11px] font-mono leading-relaxed no-scrollbar">
        {highlightedHtml ? (
          <div
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            className="shiki-wrapper [&>pre]:!bg-transparent [&>pre]:!m-0 [&>pre]:!p-0 [&>pre]:overflow-x-auto"
          />
        ) : (
          <pre className="text-cyan-100/90 whitespace-pre font-mono">
            {code}
          </pre>
        )}
      </div>
    </div>
  );
};

// Render inline markdown elements: bold, italic, inline code, links
const renderInline = (text: string): React.ReactNode[] => {
  const elements: React.ReactNode[] = [];
  // markdown regex
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }

    const raw = match[0];
    const key = `${match.index}-${raw}`;

    if (raw.startsWith("**") && raw.endsWith("**")) {
      elements.push(
        <strong key={key} className="font-semibold text-white">
          {raw.slice(2, -2)}
        </strong>
      );
    } else if (raw.startsWith("*") && raw.endsWith("*")) {
      elements.push(
        <em key={key} className="italic text-neutral-200">
          {raw.slice(1, -1)}
        </em>
      );
    } else if (raw.startsWith("`") && raw.endsWith("`")) {
      elements.push(
        <code
          key={key}
          className="px-1.5 py-0.5 mx-0.5 rounded-md bg-[#040e1b] border border-cyan-500/25 text-cyan-300 font-mono text-[11px] font-medium"
        >
          {raw.slice(1, -1)}
        </code>
      );
    } else if (raw.startsWith("[") && raw.includes("](") && raw.endsWith(")")) {
      const linkMatch = raw.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        elements.push(
          <a
            key={key}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        elements.push(raw);
      }
    } else {
      elements.push(raw);
    }

    lastIndex = match.index + raw.length;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements;
};

export const MarkdownContent: React.FC<MarkdownContentProps> = ({
  content,
  isUser = false,
}) => {
  if (isUser) {
    return <span className="whitespace-pre-wrap">{content}</span>;
  }

  // parse blocks
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\r?\n([\s\S]*?)```/g;
  const blocks: Array<
    | { type: "code"; language: string; code: string }
    | { type: "text"; text: string }
  > = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({
        type: "text",
        text: content.slice(lastIndex, match.index),
      });
    }
    blocks.push({
      type: "code",
      language: match[1] || "text",
      code: match[2].trimEnd(),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    blocks.push({
      type: "text",
      text: content.slice(lastIndex),
    });
  }

  return (
    <div className="space-y-1.5 text-xs text-neutral-100 leading-relaxed font-sans select-text">
      {blocks.map((block, idx) => {
        if (block.type === "code") {
          return (
            <CodeBlock
              key={`code-${idx}`}
              code={block.code}
              language={block.language}
            />
          );
        }

        // text blocks
        const lines = block.text.split(/\r?\n/);
        const renderedLines: React.ReactNode[] = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trim();

          if (!trimmed) {
            renderedLines.push(<div key={`empty-${i}`} className="h-1.5" />);
            continue;
          }

          // headers
          if (trimmed.startsWith("### ")) {
            renderedLines.push(
              <h3
                key={`h3-${i}`}
                className="text-xs font-bold text-cyan-300 mt-2 mb-1 flex items-center gap-1.5"
              >
                <Code2 className="w-3.5 h-3.5 text-cyan-400 inline" />
                {renderInline(trimmed.slice(4))}
              </h3>
            );
          } else if (trimmed.startsWith("## ")) {
            renderedLines.push(
              <h2
                key={`h2-${i}`}
                className="text-sm font-bold text-white mt-2.5 mb-1"
              >
                {renderInline(trimmed.slice(3))}
              </h2>
            );
          } else if (trimmed.startsWith("# ")) {
            renderedLines.push(
              <h1
                key={`h1-${i}`}
                className="text-base font-extrabold text-white mt-3 mb-1.5"
              >
                {renderInline(trimmed.slice(2))}
              </h1>
            );
          }
          // blockquotes
          else if (trimmed.startsWith("> ")) {
            renderedLines.push(
              <blockquote
                key={`quote-${i}`}
                className="my-1.5 pl-2.5 py-1 border-l-2 border-cyan-400/60 bg-cyan-950/30 rounded-r-md text-cyan-200/90 italic text-[11px]"
              >
                {renderInline(trimmed.slice(2))}
              </blockquote>
            );
          }
          // unordered list
          else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            renderedLines.push(
              <div
                key={`li-${i}`}
                className="flex items-start gap-1.5 pl-1 my-0.5"
              >
                <span className="text-cyan-400 select-none mt-0.5">•</span>
                <span className="flex-1 text-neutral-200">
                  {renderInline(trimmed.slice(2))}
                </span>
              </div>
            );
          }
          // ordered list
          else if (/^\d+\.\s/.test(trimmed)) {
            const numMatch = trimmed.match(/^(\d+)\.\s(.*)$/);
            if (numMatch) {
              renderedLines.push(
                <div
                  key={`num-${i}`}
                  className="flex items-start gap-1.5 pl-1 my-0.5"
                >
                  <span className="font-mono text-[10px] font-bold text-cyan-400 select-none mt-0.5">
                    {numMatch[1]}.
                  </span>
                  <span className="flex-1 text-neutral-200">
                    {renderInline(numMatch[2])}
                  </span>
                </div>
              );
            }
          }
          // paragraph
          else {
            renderedLines.push(
              <p key={`p-${i}`} className="my-0.5">
                {renderInline(line)}
              </p>
            );
          }
        }

        return <div key={`text-block-${idx}`}>{renderedLines}</div>;
      })}
    </div>
  );
};
