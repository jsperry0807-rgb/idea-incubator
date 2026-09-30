/**
 * Appending interview outcomes to the idea's `## Assumptions` list.
 *
 * Kept pure and separate from the service so the markdown surgery is unit
 * testable without a filesystem: deferring a question is a planning outcome
 * that must travel with the idea, and hand-edited content in `overview.md`
 * must survive it.
 */

export const ASSUMPTIONS_HEADING = "## Assumptions";

export function formatAssumption(pointTitle: string, reason?: string): string {
  const trimmed = reason?.trim();
  return `- ${pointTitle}: ${trimmed && trimmed.length > 0 ? trimmed : "deferred without a reason"}`;
}

/**
 * Returns `overview.md` content with `entry` appended to its Assumptions list,
 * creating the section when absent. Everything outside that section is
 * preserved byte for byte.
 */
export function appendAssumption(
  content: string,
  pointTitle: string,
  reason?: string,
): string {
  const entry = formatAssumption(pointTitle, reason);
  const heading = /^##[ \t]+Assumptions[ \t]*$/im;
  const match = heading.exec(content);

  if (!match) {
    const base = content.replace(/\s*$/, "\n");
    return `${base}\n${ASSUMPTIONS_HEADING}\n\n${entry}\n`;
  }

  const afterHeading = match.index + match[0].length;
  const rest = content.slice(afterHeading);
  const nextHeading = rest.search(/^##[ \t]+/m);
  const body = nextHeading === -1 ? rest : rest.slice(0, nextHeading);
  const tail = nextHeading === -1 ? "" : rest.slice(nextHeading);

  const spacedBody = body.replace(/\s*$/, "\n");
  const rebuiltTail = nextHeading === -1 ? "" : `\n${tail.replace(/^\n+/, "")}`;

  return content.slice(0, afterHeading) + spacedBody + entry + "\n" + rebuiltTail;
}
