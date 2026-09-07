import { Fragment } from "react";
import {
  LegalFooterNote,
  LegalHero,
  LegalLayout,
  LegalList,
  LegalSection,
  Placeholder,
} from "./legal-page";
import {
  isExternalHref,
  parseLegalBody,
  type LegalBlock,
  type LegalInline,
} from "@/lib/legal/legal-format";
import type { LegalDoc } from "@/lib/legal/legal-docs";

/**
 * Renders a staff-editable legal document (Privacy, Terms, Cookies) from its
 * stored body text. Used by the public legal pages AND the portal live
 * preview, so staff always see exactly what visitors will see.
 *
 * Client-safe by construction: no server imports, everything renders as React
 * nodes (stored content can never inject markup).
 */
export function LegalDocument({ doc }: { doc: LegalDoc }) {
  const sections = parseLegalBody(doc.body);
  const headed = sections.filter((section) => section.heading);
  const numbers = new Map(headed.map((section, index) => [section.id, index + 1]));

  return (
    <div className="flex flex-col">
      <LegalHero
        eyebrow="Legal"
        title={doc.title}
        summary={doc.summary}
        lastUpdated={doc.updated}
      />

      <LegalLayout toc={headed.map((section) => ({ id: section.id, title: section.heading }))}>
        {sections.map((section) =>
          section.heading ? (
            <LegalSection
              key={section.id}
              id={section.id}
              title={`${numbers.get(section.id)}. ${section.heading}`}
            >
              <LegalBlocks blocks={section.blocks} tableCaption={`Details for ${section.heading}`} />
            </LegalSection>
          ) : (
            // Content above the first heading renders without a section title.
            <div
              key="preamble"
              className="mb-12 space-y-4 text-base leading-relaxed text-gray-700"
            >
              <LegalBlocks blocks={section.blocks} tableCaption="Introduction" />
            </div>
          )
        )}

        <LegalFooterNote />
      </LegalLayout>
    </div>
  );
}

function LegalBlocks({ blocks, tableCaption }: { blocks: LegalBlock[]; tableCaption: string }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <p key={index}>
              <LegalInlines inlines={block.inlines} />
            </p>
          );
        }
        if (block.type === "list") {
          return (
            <LegalList
              key={index}
              items={block.items.map((inlines, itemIndex) => (
                <Fragment key={itemIndex}>
                  <LegalInlines inlines={inlines} />
                </Fragment>
              ))}
            />
          );
        }
        return <LegalTable key={index} block={block} caption={tableCaption} />;
      })}
    </>
  );
}

function LegalTable({
  block,
  caption,
}: {
  block: Extract<LegalBlock, { type: "table" }>;
  caption: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-700">
          <tr>
            {block.head.map((cell, index) => (
              <th key={index} scope="col" className="px-4 py-3 font-bold">
                <LegalInlines inlines={cell} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {block.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3">
                  <LegalInlines inlines={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LegalInlines({ inlines }: { inlines: LegalInline[] }) {
  return (
    <>
      {inlines.map((node, index) => {
        switch (node.kind) {
          case "bold":
            return <strong key={index}>{node.text}</strong>;
          case "italic":
            return <em key={index}>{node.text}</em>;
          case "code":
            return (
              <code key={index} className="font-mono text-[0.9em]">
                {node.text}
              </code>
            );
          case "placeholder":
            return <Placeholder key={index}>{node.text}</Placeholder>;
          case "link": {
            const external = isExternalHref(node.href);
            return (
              <a
                key={index}
                href={node.href}
                className="font-semibold text-primary underline underline-offset-2 hover:text-primary-dark"
                {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
              >
                {node.text}
              </a>
            );
          }
          default:
            return <Fragment key={index}>{node.text}</Fragment>;
        }
      })}
    </>
  );
}
