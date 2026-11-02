import {
  BibliographyEntry,
  CitationStyle,
  FormattedCitation,
  FormattedSpan
} from '../../types/bibliography';
import { formatAPA7 } from './apa7';
import { formatAPA6 } from './apa6';
import { formatMLA } from './mla';
import { formatChicago } from './chicago';
import { formatHarvard } from './harvard';
import { formatVancouver } from './vancouver';
import { generateInTextCitation } from './inTextCitation';

/**
 * Format a single bibliography entry according to the selected style
 */
export function formatCitation(
  entry: BibliographyEntry,
  style: CitationStyle,
  indexNumber: number = 1
): FormattedCitation {
  let spans: FormattedSpan[] = [];

  switch (style) {
    case 'apa7':
      spans = formatAPA7(entry);
      break;
    case 'apa6':
      spans = formatAPA6(entry);
      break;
    case 'mla9':
      spans = formatMLA(entry);
      break;
    case 'chicago':
      spans = formatChicago(entry);
      break;
    case 'harvard':
      spans = formatHarvard(entry);
      break;
    case 'vancouver':
      spans = formatVancouver(entry, indexNumber);
      break;
    default:
      spans = formatAPA7(entry);
  }

  // Convert spans to plain text
  const plainText = spans.map((s) => s.text).join('').trim();

  // Convert spans to HTML
  const htmlText = spans
    .map((s) => {
      let t = escapeHtml(s.text);
      if (s.italic) t = `<em>${t}</em>`;
      if (s.bold) t = `<strong>${t}</strong>`;
      if (s.underline) t = `<u>${t}</u>`;
      if (s.isUrl) {
        const rawUrl = s.text.trim();
        t = `<a href="${rawUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">${t}</a>`;
      }
      return t;
    })
    .join('');

  // In-text citation
  const inText = generateInTextCitation(entry, style, indexNumber);

  // Generate sorting key (Author primary, or Title)
  const sortKey = getEntrySortKey(entry);

  return {
    id: entry.id,
    style,
    spans,
    plainText,
    htmlText,
    inTextParenthetical: inText.parenthetical,
    inTextNarrative: inText.narrative,
    sortKey,
    citationNumber: indexNumber
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate sort key based on first author's name or title
 */
export function getEntrySortKey(entry: BibliographyEntry): string {
  if (entry.authors && entry.authors.length > 0) {
    const a = entry.authors[0];
    if (a.isOrganization) {
      return a.firstName.trim();
    }
    if (a.isThai || entry.language === 'th') {
      return `${a.firstName.trim()} ${a.lastName?.trim() || ''}`.trim();
    }
    return `${a.lastName.trim()}, ${a.firstName.trim()}`.trim();
  }
  return entry.title.trim();
}

/**
 * Sort bibliography entries:
 * - For Vancouver: Usually sorted by citation number or creation order, unless user toggles alphabetical.
 * - For other styles: Alphabetical (Thai first or mixed)
 */
export function sortBibliographyEntries(
  entries: BibliographyEntry[],
  options: { thaiFirst?: boolean; style?: CitationStyle; sortByNumber?: boolean } = {
    thaiFirst: true,
    sortByNumber: false
  }
): BibliographyEntry[] {
  // If Vancouver and sortByNumber is true, preserve citation order
  if (options.style === 'vancouver' && options.sortByNumber) {
    return [...entries].sort((a, b) => (a.citationNumber || 0) - (b.citationNumber || 0));
  }

  const thaiCollator = new Intl.Collator('th-TH', { sensitivity: 'base', numeric: true });
  const enCollator = new Intl.Collator('en-US', { sensitivity: 'base', numeric: true });

  return [...entries].sort((a, b) => {
    const aIsThai = a.language === 'th' || /[\u0E00-\u0E7F]/.test(getEntrySortKey(a));
    const bIsThai = b.language === 'th' || /[\u0E00-\u0E7F]/.test(getEntrySortKey(b));

    if (options.thaiFirst) {
      if (aIsThai && !bIsThai) return -1;
      if (!aIsThai && bIsThai) return 1;
    }

    const keyA = getEntrySortKey(a);
    const keyB = getEntrySortKey(b);

    const collator = aIsThai ? thaiCollator : enCollator;
    const authorCompare = collator.compare(keyA, keyB);
    if (authorCompare !== 0) return authorCompare;

    const yearA = parseInt(a.year || '0', 10);
    const yearB = parseInt(b.year || '0', 10);
    if (yearA !== yearB) return yearA - yearB;

    return collator.compare(a.title, b.title);
  });
}
