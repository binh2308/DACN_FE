"use client";

type Props = {
  content: string;
};

function renderInline(text: string) {
  const parts: React.ReactNode[] = [];
  const segments = text.split(/(`[^`]*`)/g);

  segments.forEach((segment, index) => {
    if (!segment) return;
    if (segment.startsWith("`") && segment.endsWith("`")) {
      parts.push(
        <code key={`code-${index}`} className="rounded bg-gray-200 px-1 py-0.5 font-mono text-[0.95em]">
          {segment.slice(1, -1)}
        </code>,
      );
      return;
    }

    parts.push(segment);
  });

  return parts;
}

function renderBlocks(content: string) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const nodes: React.ReactNode[] = [];
  let paragraph: string[] = [];
  let codeLines: string[] = [];
  let inCode = false;
  let codeKey = 0;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    nodes.push(
      <p key={`p-${nodes.length}`} className="whitespace-pre-wrap leading-6">
        {renderInline(paragraph.join(" "))}
      </p>,
    );
    paragraph = [];
  };

  const flushCode = () => {
    nodes.push(
      <pre key={`code-${codeKey++}`} className="my-2 overflow-x-auto rounded-md bg-neutral-900 p-3 text-sm text-neutral-100">
        <code>{codeLines.join("\n")}</code>
      </pre>,
    );
    codeLines = [];
  };

  lines.forEach((line) => {
    const fenceMatch = line.match(/^```/);
    if (fenceMatch) {
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        flushParagraph();
        inCode = true;
      }
      return;
    }

    if (inCode) {
      codeLines.push(line);
      return;
    }

    if (!line.trim()) {
      flushParagraph();
      return;
    }

    paragraph.push(line.trim());
  });

  if (inCode && codeLines.length) {
    flushCode();
  }
  flushParagraph();

  return nodes;
}

export default function MarkdownRenderer({ content }: Props) {
  return <div className="space-y-2">{renderBlocks(content)}</div>;
}
