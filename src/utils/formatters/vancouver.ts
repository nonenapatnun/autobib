import { BibliographyEntry, FormattedSpan, Author } from '../../types/bibliography';

/**
 * Format authors for Vancouver Style (ICMJE / NLM)
 * Rules:
 * - Surname followed by Initials with NO periods and NO commas between initials (e.g., Smith JA)
 * - Comma between authors
 * - 1 to 6 authors -> list all
 * - 7+ authors -> list first 6, then et al.
 */
export function formatAuthorsVancouver(authors: Author[], isThai: boolean): string {
  if (!authors || authors.length === 0) {
    return '';
  }

  const formatOne = (a: Author) => {
    if (a.isOrganization) return a.firstName.trim();
    if (a.isThai || isThai) {
      if (a.lastName) return `${a.firstName.trim()} ${a.lastName.trim()}`;
      return a.firstName.trim();
    }
    const last = a.lastName.trim();
    const firstNames = a.firstName.trim().split(/\s+/);
    // Initials without periods
    const initials = firstNames
      .filter(Boolean)
      .map((n) => n.replace(/\./g, '')[0]?.toUpperCase() || '')
      .join('');
    return last && initials ? `${last} ${initials}` : last || a.firstName.trim();
  };

  const count = authors.length;

  if (count <= 6) {
    return authors.map(formatOne).join(', ') + '.';
  }

  // 7 or more authors: first 6 + et al.
  const first6 = authors.slice(0, 6).map(formatOne).join(', ');
  const etAl = isThai ? ', และคณะ.' : ', et al.';
  return `${first6}${etAl}`;
}

/**
 * Format citation for Vancouver Style (Numbered referencing)
 */
export function formatVancouver(
  entry: BibliographyEntry,
  indexNumber: number = 1
): FormattedSpan[] {
  const isThai = entry.language === 'th';
  const spans: FormattedSpan[] = [];

  // 0. Reference Number prefix (e.g. "1. ")
  spans.push({ text: `${indexNumber}. `, bold: true });

  // 1. Author
  const authorsText = formatAuthorsVancouver(entry.authors, isThai);
  if (authorsText) {
    spans.push({ text: authorsText + ' ' });
  }

  // 2. Content
  switch (entry.sourceType) {
    case 'book': {
      // Title of book (Roman/Regular in standard Vancouver, no italics)
      spans.push({ text: `${entry.title.trim()}.` });

      if (entry.edition) {
        const edStr = isThai ? ` พิมพ์ครั้งที่ ${entry.edition}.` : ` ${entry.edition} ed.`;
        spans.push({ text: edStr });
      }

      if (entry.place && entry.publisher) {
        spans.push({ text: ` ${entry.place.trim()}: ${entry.publisher.trim()}` });
      } else if (entry.publisher) {
        spans.push({ text: ` ${entry.publisher.trim()}` });
      }

      // Year followed by semicolon or period
      if (entry.year) {
        spans.push({ text: `; ${entry.year.trim()}.` });
      } else {
        spans.push({ text: '.' });
      }

      appendDoiOrUrlVancouver(entry, spans);
      break;
    }

    case 'journal': {
      // Article title
      spans.push({ text: `${entry.title.trim()}. ` });

      // Journal title (standard or abbreviation)
      if (entry.containerTitle) {
        spans.push({ text: `${entry.containerTitle.trim()}. ` });
      }

      // Year;Volume(Issue):pages
      if (entry.year) {
        spans.push({ text: `${entry.year.trim()}` });
      }

      if (entry.volume) {
        spans.push({ text: `;${entry.volume.trim()}` });
        if (entry.issue) {
          spans.push({ text: `(${entry.issue.trim()})` });
        }
      }

      if (entry.pages) {
        spans.push({ text: `:${entry.pages.trim()}` });
      }
      spans.push({ text: '.' });

      appendDoiOrUrlVancouver(entry, spans);
      break;
    }

    case 'chapter': {
      spans.push({ text: `${entry.title.trim()}. ` });
      const inPrefix = isThai ? 'ใน: ' : 'In: ';
      spans.push({ text: inPrefix });

      if (entry.editors && entry.editors.length > 0) {
        const edText = formatAuthorsVancouver(entry.editors, isThai);
        const edLabel = isThai ? ' บรรณาธิการ. ' : ' editor(s). ';
        spans.push({ text: `${edText}${edLabel}` });
      }

      if (entry.containerTitle) {
        spans.push({ text: `${entry.containerTitle.trim()}. ` });
      }

      if (entry.place && entry.publisher) {
        spans.push({ text: `${entry.place.trim()}: ${entry.publisher.trim()}; ` });
      }

      if (entry.year) {
        spans.push({ text: `${entry.year.trim()}. ` });
      }

      if (entry.pages) {
        const pLabel = isThai ? 'น. ' : 'p. ';
        spans.push({ text: `${pLabel}${entry.pages.trim()}.` });
      }

      appendDoiOrUrlVancouver(entry, spans);
      break;
    }

    case 'website': {
      spans.push({ text: `${entry.title.trim()} [Internet]. ` });

      if (entry.place && entry.publisher) {
        spans.push({ text: `${entry.place.trim()}: ${entry.publisher.trim()}; ` });
      } else if (entry.publisher || entry.containerTitle) {
        spans.push({ text: `${(entry.publisher || entry.containerTitle)?.trim()}; ` });
      }

      if (entry.year) {
        spans.push({ text: `${entry.year.trim()} ` });
      }

      if (entry.accessDate) {
        const citedPrefix = isThai ? `[สืบค้นเมื่อ ${entry.accessDate}]. ` : `[cited ${entry.accessDate}]. `;
        spans.push({ text: citedPrefix });
      }

      if (entry.url) {
        const availPrefix = isThai ? 'เข้าถึงได้จาก: ' : 'Available from: ';
        spans.push({ text: `${availPrefix}${entry.url.trim()}`, isUrl: true });
      }
      break;
    }

    case 'thesis': {
      spans.push({ text: `${entry.title.trim()} ` });
      const degree = entry.degreeType || (isThai ? 'วิทยานิพนธ์ปริญญามหาบัณฑิต' : "Master's thesis");
      const inst = entry.institution || entry.publisher || '';
      spans.push({ text: `[${degree}]. ${inst}; ` });
      if (entry.year) {
        spans.push({ text: `${entry.year.trim()}.` });
      }
      appendDoiOrUrlVancouver(entry, spans);
      break;
    }

    default: {
      spans.push({ text: `${entry.title.trim()}. ` });
      if (entry.publisher) {
        spans.push({ text: `${entry.publisher.trim()}; ` });
      }
      if (entry.year) {
        spans.push({ text: `${entry.year.trim()}.` });
      }
      appendDoiOrUrlVancouver(entry, spans);
      break;
    }
  }

  return spans;
}

function appendDoiOrUrlVancouver(entry: BibliographyEntry, spans: FormattedSpan[]) {
  if (entry.doi) {
    const cleanDoi = entry.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '');
    spans.push({ text: ` doi:${cleanDoi}` });
  } else if (entry.url && entry.sourceType !== 'website') {
    spans.push({ text: ` Available from: ${entry.url.trim()}`, isUrl: true });
  }
}
