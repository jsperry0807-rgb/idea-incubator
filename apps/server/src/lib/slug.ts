export function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "idea";
}

export function ensureUniqueSlug(
  base: string,
  existingSlugs: string[],
): string {
  if (!existingSlugs.includes(base)) return base;

  let i = 2;
  while (existingSlugs.includes(`${base}-${i}`)) {
    i += 1;
  }
  return `${base}-${i}`;
}
