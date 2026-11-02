import { BibliographyEntry, Author } from '../../types/bibliography';

export type DuplicateMatchReason = 'doi' | 'isbn' | 'title';

export interface DuplicateGroup {
  id: string;
  entries: BibliographyEntry[];
  reasons: DuplicateMatchReason[];
  matchedFieldsSummary: {
    doi?: string;
    isbn?: string;
    title?: string;
  };
  similarityScore: number; // 0 to 100
  recommendedPrimaryId: string;
  mergedPreview: BibliographyEntry;
  complementaryFieldsCount: number;
}

export interface DuplicateReport {
  groups: DuplicateGroup[];
  duplicateEntryIds: Set<string>;
  entryToGroupMap: Record<string, DuplicateGroup>;
  totalDuplicateGroups: number;
  totalRedundantEntries: number;
}

const PLACEHOLDER_VALUES = new Set([
  'ม.ป.ป.',
  'ม.ป.ท.',
  'n.d.',
  'n.p.',
  's.l.',
  's.n.',
]);

function isPlaceholderOrEmpty(val?: string): boolean {
  if (!val || !val.trim()) return true;
  return PLACEHOLDER_VALUES.has(val.trim().toLowerCase()) || PLACEHOLDER_VALUES.has(val.trim());
}

/**
 * Normalize DOI by stripping protocol, domain, and "doi:" prefix
 */
export function normalizeDoi(doi?: string): string {
  if (!doi || !doi.trim()) return '';
  return doi
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
    .replace(/\s+/g, '');
}

/**
 * Normalize ISBN by stripping hyphens, spaces, and keeping digits + 'X'
 */
export function normalizeIsbn(isbn?: string): string {
  if (!isbn || !isbn.trim()) return '';
  const cleaned = isbn
    .trim()
    .replace(/^isbn(?:-1[03])?:?\s*/i, '')
    .replace(/[^0-9xX]/g, '')
    .toUpperCase();
  return cleaned.length >= 9 ? cleaned : '';
}

/**
 * Check if two ISBNs refer to the same book (handles ISBN-10 vs ISBN-13 978 conversion)
 */
export function areIsbnsEquivalent(isbnA?: string, isbnB?: string): boolean {
  const normA = normalizeIsbn(isbnA);
  const normB = normalizeIsbn(isbnB);
  if (!normA || !normB) return false;
  if (normA === normB) return true;

  // Compare 9-digit core between ISBN-10 and ISBN-13 (978 prefix)
  if (normA.length === 10 && normB.length === 13 && normB.startsWith('978')) {
    return normA.slice(0, 9) === normB.slice(3, 12);
  }
  if (normB.length === 10 && normA.length === 13 && normA.startsWith('978')) {
    return normB.slice(0, 9) === normA.slice(3, 12);
  }
  return false;
}

/**
 * Strip copy suffixes like "(สำเนา)", "(Copy)", "[Duplicate]" and normalize title for comparison
 */
export function cleanCopySuffixFromTitle(title: string): string {
  if (!title) return '';
  return title
    .replace(/\s*(\(สำเนา.*?\)|\(copy.*?\)|\(duplicate.*?\)|\[สำเนา.*?\]|\[copy.*?\])\s*$/gi, '')
    .trim();
}

export function normalizeTitle(title?: string): string {
  if (!title || !title.trim()) return '';
  const withoutCopy = cleanCopySuffixFromTitle(title);
  return withoutCopy
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\u0E00-\u0E7F\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Compute Sørensen–Dice bigram similarity between two normalized strings (0..1)
 */
export function computeTitleSimilarity(titleA?: string, titleB?: string): number {
  const normA = normalizeTitle(titleA);
  const normB = normalizeTitle(titleB);
  if (!normA || !normB) return 0;
  if (normA === normB) return 1;

  // Compact without spaces for Thai/mixed text comparison
  const compactA = normA.replace(/\s+/g, '');
  const compactB = normB.replace(/\s+/g, '');
  if (compactA === compactB) return 1;
  if (compactA.length < 6 || compactB.length < 6) return 0;

  const bigramsA = new Map<string, number>();
  for (let i = 0; i < compactA.length - 1; i++) {
    const bg = compactA.slice(i, i + 2);
    bigramsA.set(bg, (bigramsA.get(bg) || 0) + 1);
  }

  let intersection = 0;
  for (let i = 0; i < compactB.length - 1; i++) {
    const bg = compactB.slice(i, i + 2);
    const count = bigramsA.get(bg) || 0;
    if (count > 0) {
      intersection++;
      bigramsA.set(bg, count - 1);
    }
  }

  return (2 * intersection) / (compactA.length - 1 + (compactB.length - 1));
}

/**
 * Score how complete a BibliographyEntry is (higher = more real metadata fields populated)
 */
export function getEntryCompletenessScore(entry: BibliographyEntry): number {
  let score = 0;

  const validAuthors = (entry.authors || []).filter(
    (a) => a.firstName.trim() || a.lastName.trim()
  );
  if (validAuthors.length > 0) {
    score += 15 + Math.min(validAuthors.length * 3, 15);
  }

  if (entry.title && entry.title.trim()) {
    score += 15;
    if (cleanCopySuffixFromTitle(entry.title) === entry.title.trim()) {
      score += 4; // Prefer clean title without "(สำเนา)"
    }
  }

  if (!isPlaceholderOrEmpty(entry.year)) score += 10;
  else if (entry.year?.trim()) score += 3;

  if (!isPlaceholderOrEmpty(entry.doi)) score += 18;
  if (!isPlaceholderOrEmpty(entry.isbn)) score += 16;
  if (!isPlaceholderOrEmpty(entry.containerTitle)) score += 10;
  if (!isPlaceholderOrEmpty(entry.publisher)) score += 8;
  if (!isPlaceholderOrEmpty(entry.place)) score += 6;
  if (!isPlaceholderOrEmpty(entry.volume)) score += 6;
  if (!isPlaceholderOrEmpty(entry.issue)) score += 5;
  if (!isPlaceholderOrEmpty(entry.pages)) score += 7;
  if (!isPlaceholderOrEmpty(entry.url)) score += 6;
  if (!isPlaceholderOrEmpty(entry.edition)) score += 4;
  if (!isPlaceholderOrEmpty(entry.institution)) score += 6;
  if (!isPlaceholderOrEmpty(entry.degreeType)) score += 4;
  if (!isPlaceholderOrEmpty(entry.accessDate)) score += 3;

  return score;
}

/**
 * Merge multiple duplicate entries into a single enriched BibliographyEntry,
 * preserving the primary entry's ID and filling in any missing/placeholder fields
 * from the other entries in the duplicate cluster.
 */
export function mergeDuplicateEntries(
  entriesToMerge: BibliographyEntry[],
  preferredPrimaryId?: string
): BibliographyEntry {
  if (entriesToMerge.length === 0) {
    throw new Error('Cannot merge an empty list of entries');
  }
  if (entriesToMerge.length === 1) {
    return { ...entriesToMerge[0] };
  }

  // Sort by preferredPrimaryId first, then by completeness score descending
  const sorted = [...entriesToMerge].sort((a, b) => {
    if (preferredPrimaryId) {
      if (a.id === preferredPrimaryId) return -1;
      if (b.id === preferredPrimaryId) return 1;
    }
    return getEntryCompletenessScore(b) - getEntryCompletenessScore(a);
  });

  const primary = sorted[0];
  const merged: BibliographyEntry = {
    ...primary,
    title: cleanCopySuffixFromTitle(primary.title) || primary.title,
    authors: [...(primary.authors || [])],
    updatedAt: Date.now(),
  };

  // Pick the most complete author list across all duplicates
  let bestAuthors: Author[] = (merged.authors || []).filter(
    (a) => a.firstName.trim() || a.lastName.trim()
  );
  for (const candidate of sorted) {
    const candidateAuthors = (candidate.authors || []).filter(
      (a) => a.firstName.trim() || a.lastName.trim()
    );
    if (candidateAuthors.length > bestAuthors.length) {
      bestAuthors = candidateAuthors.map((a) => ({ ...a }));
    } else if (
      candidateAuthors.length === bestAuthors.length &&
      candidateAuthors.length > 0
    ) {
      // Check if candidate has fuller author names (both first & last name)
      const currentFullCount = bestAuthors.filter(
        (a) => a.firstName.trim() && a.lastName.trim()
      ).length;
      const candidateFullCount = candidateAuthors.filter(
        (a) => a.firstName.trim() && a.lastName.trim()
      ).length;
      if (candidateFullCount > currentFullCount) {
        bestAuthors = candidateAuthors.map((a) => ({ ...a }));
      }
    }
  }
  if (bestAuthors.length > 0) {
    merged.authors = bestAuthors;
  }

  // Helper to pick best string field across all entries in the group
  const stringFields: (keyof BibliographyEntry)[] = [
    'year',
    'monthDay',
    'containerTitle',
    'volume',
    'issue',
    'pages',
    'edition',
    'publisher',
    'place',
    'doi',
    'isbn',
    'url',
    'accessDate',
    'institution',
    'degreeType',
    'conferenceName',
    'editors',
  ];

  for (const field of stringFields) {
    const currentVal = merged[field] as string | undefined;
    if (isPlaceholderOrEmpty(currentVal)) {
      // Find first non-placeholder value from other entries
      const realCandidate = sorted.find(
        (e) => !isPlaceholderOrEmpty(e[field] as string | undefined)
      );
      if (realCandidate && typeof realCandidate[field] === 'string') {
        (merged as any)[field] = (realCandidate[field] as string).trim();
      } else if (!currentVal || !currentVal.trim()) {
        // Fallback to any non-empty value
        const anyCandidate = sorted.find((e) => {
          const v = e[field];
          return typeof v === 'string' && v.trim().length > 0;
        });
        if (anyCandidate && typeof anyCandidate[field] === 'string') {
          (merged as any)[field] = (anyCandidate[field] as string).trim();
        }
      }
    }
  }

  // Normalize DOI if present
  if (merged.doi) {
    merged.doi = normalizeDoi(merged.doi);
  }

  return merged;
}

/**
 * Scan all bibliography entries and detect duplicate clusters based on:
 * 1. DOI (normalized match)
 * 2. ISBN (normalized ISBN-10 / ISBN-13 match)
 * 3. Title (exact normalized match or >= 88% similarity)
 */
export function detectDuplicates(entries: BibliographyEntry[]): DuplicateReport {
  const n = entries.length;
  const parent = Array.from({ length: n }, (_, i) => i);

  function find(i: number): number {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  }

  function union(i: number, j: number) {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) {
      parent[rootJ] = rootI;
    }
  }

  // Track match reasons and similarity for pairs
  const pairReasons = new Map<string, Set<DuplicateMatchReason>>();
  const pairSimilarity = new Map<string, number>();

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = entries[i];
      const b = entries[j];
      const matchedReasons = new Set<DuplicateMatchReason>();
      let maxSim = 0;

      // 1. Check DOI
      const doiA = normalizeDoi(a.doi);
      const doiB = normalizeDoi(b.doi);
      if (doiA && doiB && doiA === doiB) {
        matchedReasons.add('doi');
        maxSim = 100;
      }

      // 2. Check ISBN
      if (areIsbnsEquivalent(a.isbn, b.isbn)) {
        matchedReasons.add('isbn');
        maxSim = 100;
      }

      // 3. Check Title
      const titleSim = computeTitleSimilarity(a.title, b.title);
      if (titleSim >= 0.88) {
        matchedReasons.add('title');
        maxSim = Math.max(maxSim, Math.round(titleSim * 100));
      }

      if (matchedReasons.size > 0) {
        union(i, j);
        const key = `${i}-${j}`;
        pairReasons.set(key, matchedReasons);
        pairSimilarity.set(key, maxSim);
      }
    }
  }

  // Group indices by connected component root
  const componentMap = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    if (!componentMap.has(root)) {
      componentMap.set(root, []);
    }
    componentMap.get(root)!.push(i);
  }

  const groups: DuplicateGroup[] = [];
  const duplicateEntryIds = new Set<string>();
  const entryToGroupMap: Record<string, DuplicateGroup> = {};

  let groupCounter = 1;
  for (const [, indices] of componentMap.entries()) {
    if (indices.length < 2) continue;

    const groupEntries = indices.map((idx) => entries[idx]);
    const reasonsSet = new Set<DuplicateMatchReason>();
    let bestSimilarity = 90;

    for (let x = 0; x < indices.length; x++) {
      for (let y = x + 1; y < indices.length; y++) {
        const key = `${indices[x]}-${indices[y]}`;
        const rSet = pairReasons.get(key);
        if (rSet) {
          rSet.forEach((r) => reasonsSet.add(r));
        }
        const sim = pairSimilarity.get(key);
        if (sim && sim > bestSimilarity) {
          bestSimilarity = sim;
        }
      }
    }

    // Order reasons: doi, isbn, title
    const orderedReasons: DuplicateMatchReason[] = (
      ['doi', 'isbn', 'title'] as DuplicateMatchReason[]
    ).filter((r) => reasonsSet.has(r));

    // Rank entries to find recommended primary
    const rankedByCompleteness = [...groupEntries].sort(
      (a, b) => getEntryCompletenessScore(b) - getEntryCompletenessScore(a)
    );
    const recommendedPrimary = rankedByCompleteness[0];
    const mergedPreview = mergeDuplicateEntries(groupEntries, recommendedPrimary.id);

    // Count how many fields in mergedPreview were enriched beyond recommendedPrimary
    let complementaryFieldsCount = 0;
    const compareFields: (keyof BibliographyEntry)[] = [
      'year',
      'containerTitle',
      'volume',
      'issue',
      'pages',
      'publisher',
      'place',
      'doi',
      'isbn',
      'url',
      'edition',
      'institution',
    ];
    for (const f of compareFields) {
      if (
        isPlaceholderOrEmpty(recommendedPrimary[f] as string | undefined) &&
        !isPlaceholderOrEmpty(mergedPreview[f] as string | undefined)
      ) {
        complementaryFieldsCount++;
      }
    }

    const matchedFieldsSummary: DuplicateGroup['matchedFieldsSummary'] = {};
    if (reasonsSet.has('doi')) {
      const d = groupEntries.find((e) => normalizeDoi(e.doi))?.doi;
      if (d) matchedFieldsSummary.doi = normalizeDoi(d);
    }
    if (reasonsSet.has('isbn')) {
      const ib = groupEntries.find((e) => normalizeIsbn(e.isbn))?.isbn;
      if (ib) matchedFieldsSummary.isbn = ib.trim();
    }
    if (reasonsSet.has('title')) {
      matchedFieldsSummary.title = cleanCopySuffixFromTitle(recommendedPrimary.title);
    }

    const group: DuplicateGroup = {
      id: `dup-group-${groupCounter++}-${recommendedPrimary.id}`,
      entries: groupEntries,
      reasons: orderedReasons,
      matchedFieldsSummary,
      similarityScore: bestSimilarity,
      recommendedPrimaryId: recommendedPrimary.id,
      mergedPreview,
      complementaryFieldsCount,
    };

    groups.push(group);
    for (const entry of groupEntries) {
      duplicateEntryIds.add(entry.id);
      entryToGroupMap[entry.id] = group;
    }
  }

  const totalRedundantEntries = groups.reduce(
    (sum, g) => sum + Math.max(0, g.entries.length - 1),
    0
  );

  return {
    groups,
    duplicateEntryIds,
    entryToGroupMap,
    totalDuplicateGroups: groups.length,
    totalRedundantEntries,
  };
}
