import { BibliographyEntry, FormattedSpan, Author } from '../../types/bibliography';

/**
 * Format authors for APA 6th Edition
 * Rule: 1-7 authors -> list all
 * 8+ authors -> first 6, ellipsis ..., last author
 */
export function formatAuthorsAPA6(authors: Author[], isThai: boolean): string {
  if (!authors || authors.length === 0) {
    return isThai ? 'ไม่ปรากฏชื่อผู้แต่ง.' : 'Unknown author.';
  }

  const formattedAuthors = authors.map((a) => {
    if (a.isOrganization) {
      return a.firstName.trim();
    }
    if (a.isThai || isThai) {
      if (a.lastName) {
        return `${a.firstName.trim()} ${a.lastName.trim()}`;
      }
      return a.firstName.trim();
    } else {
      const lastName = a.lastName.trim();
      const firstNames = a.firstName.trim().split(/\s+/);
      const initials = firstNames
        .filter(Boolean)
        .map((n) => (n.endsWith('.') ? n : `${n[0].toUpperCase()}.`))
        .join(' ');
      if (lastName && initials) {
        return `${lastName}, ${initials}`;
      }
      return lastName || a.firstName.trim();
    }
  });

  const count = formattedAuthors.length;

  if (count === 1) {
    return `${formattedAuthors[0]}.`;
  }

  if (count === 2) {
    const ampersand = isThai ? ' และ ' : ', & ';
    return `${formattedAuthors[0]}${ampersand}${formattedAuthors[1]}.`;
  }

  // 3 to 7 authors in APA 6: list all
  if (count <= 7) {
    const lastAuthor = formattedAuthors[count - 1];
    const precedingAuthors = formattedAuthors.slice(0, count - 1).join(', ');
    const ampersand = isThai ? ', และ ' : ', & ';
    return `${precedingAuthors}${ampersand}${lastAuthor}.`;
  }

  // 8+ authors: first 6, then ellipsis ..., then last author
  const first6 = formattedAuthors.slice(0, 6).join(', ');
  const lastAuthor = formattedAuthors[count - 1];
  return `${first6}, ... ${lastAuthor}.`;
}

/**
 * Format year/date for APA 6
 */
export function formatYearAPA6(entry: BibliographyEntry): string {
  let dateStr = entry.year?.trim() || '';
  if (!dateStr) {
    return entry.language === 'th' ? '(ม.ป.ป.).' : '(n.d.).';
  }

  if (entry.monthDay?.trim()) {
    dateStr = `${dateStr}, ${entry.monthDay.trim()}`;
  }

  return `(${dateStr}).`;
}

/**
 * Format citation for APA 6th Edition into structured spans
 */
export function formatAPA6(entry: BibliographyEntry): FormattedSpan[] {
  const isThai = entry.language === 'th';
  const spans: FormattedSpan[] = [];

  // 1. Authors
  const authorsText = formatAuthorsAPA6(entry.authors, isThai);
  spans.push({ text: authorsText + ' ' });

  // 2. Year
  const yearText = formatYearAPA6(entry);
  spans.push({ text: yearText + ' ' });

  // 3. Content according to source type
  switch (entry.sourceType) {
    case 'book': {
      // Title of book italicized
      const title = entry.title.trim();
      let titleWithDetails = title;
      if (entry.edition) {
        const edText = isThai ? ` (พิมพ์ครั้งที่ ${entry.edition})` : ` (${entry.edition} ed.)`;
        titleWithDetails += edText;
      }
      spans.push({ text: titleWithDetails + '.', italic: true });

      // Place: Publisher (Mandatory for APA 6!)
      if (entry.place && entry.publisher) {
        spans.push({ text: ` ${entry.place.trim()}: ${entry.publisher.trim()}.` });
      } else if (entry.publisher) {
        const defaultPlace = isThai ? 'ม.ป.ท.' : 'n.p.';
        spans.push({ text: ` ${defaultPlace}: ${entry.publisher.trim()}.` });
      }

      // DOI or URL
      appendDoiOrUrlAPA6(entry, spans);
      break;
    }

    case 'journal': {
      // Title of journal article is NOT italicized
      spans.push({ text: `${entry.title.trim()}. ` });

      // Journal container title is ITALICIZED
      if (entry.containerTitle) {
        spans.push({ text: entry.containerTitle.trim(), italic: true });
      }

      // Volume is ITALICIZED, Issue is in parentheses
      if (entry.volume) {
        spans.push({ text: `, ` });
        spans.push({ text: entry.volume.trim(), italic: true });
        if (entry.issue) {
          spans.push({ text: `(${entry.issue.trim()})` });
        }
      } else if (entry.issue) {
        spans.push({ text: `, (${entry.issue.trim()})` });
      }

      // Pages
      if (entry.pages) {
        spans.push({ text: `, ${entry.pages.trim()}` });
      }
      spans.push({ text: '.' });

      // DOI or URL
      appendDoiOrUrlAPA6(entry, spans);
      break;
    }

    case 'chapter': {
      spans.push({ text: `${entry.title.trim()}. ` });

      const inWord = isThai ? 'ใน ' : 'In ';
      spans.push({ text: inWord });

      if (entry.editors && entry.editors.length > 0) {
        const edStr = formatAuthorsAPA6(entry.editors, isThai);
        const edLabel = isThai ? ' (บ.ก.), ' : ' (Ed.), ';
        spans.push({ text: `${edStr.replace(/\.$/, '')}${edLabel}` });
      }

      if (entry.containerTitle) {
        spans.push({ text: entry.containerTitle.trim(), italic: true });
      }

      if (entry.pages) {
        const pLabel = isThai ? ` (น. ${entry.pages.trim()}).` : ` (pp. ${entry.pages.trim()}).`;
        spans.push({ text: pLabel });
      } else {
        spans.push({ text: '.' });
      }

      // Place: Publisher
      if (entry.place && entry.publisher) {
        spans.push({ text: ` ${entry.place.trim()}: ${entry.publisher.trim()}.` });
      } else if (entry.publisher) {
        spans.push({ text: ` ${entry.publisher.trim()}.` });
      }

      appendDoiOrUrlAPA6(entry, spans);
      break;
    }

    case 'website': {
      spans.push({ text: entry.title.trim(), italic: true });
      spans.push({ text: '.' });

      if (entry.containerTitle) {
        spans.push({ text: ` ${entry.containerTitle.trim()}.` });
      }

      if (entry.url) {
        const urlStr = entry.url.trim();
        const retrievePrefix = isThai
          ? entry.accessDate
            ? ` สืบค้น ${entry.accessDate}, จาก `
            : ' สืบค้นจาก '
          : entry.accessDate
            ? ` Retrieved ${entry.accessDate}, from `
            : ' Retrieved from ';
        spans.push({ text: retrievePrefix });
        spans.push({ text: urlStr, isUrl: true });
      }
      break;
    }

    case 'thesis': {
      spans.push({ text: entry.title.trim(), italic: true });
      const degree = entry.degreeType || (isThai ? 'วิทยานิพนธ์ปริญญามหาบัณฑิต' : 'Master’s thesis');
      const inst = entry.institution || entry.publisher || '';
      spans.push({ text: ` (${degree}). ${inst}.` });

      if (entry.url || entry.doi) {
        appendDoiOrUrlAPA6(entry, spans);
      }
      break;
    }

    default: {
      spans.push({ text: entry.title.trim(), italic: true });
      spans.push({ text: '.' });
      if (entry.place && entry.publisher) {
        spans.push({ text: ` ${entry.place.trim()}: ${entry.publisher.trim()}.` });
      } else if (entry.publisher) {
        spans.push({ text: ` ${entry.publisher.trim()}.` });
      }
      appendDoiOrUrlAPA6(entry, spans);
      break;
    }
  }

  return spans;
}

function appendDoiOrUrlAPA6(entry: BibliographyEntry, spans: FormattedSpan[]) {
  if (entry.doi) {
    const cleanDoi = entry.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '');
    spans.push({ text: ` doi:${cleanDoi}` });
  } else if (entry.url) {
    const isThai = entry.language === 'th';
    const prefix = isThai ? ' สืบค้นจาก ' : ' Retrieved from ';
    spans.push({ text: prefix });
    spans.push({ text: entry.url.trim(), isUrl: true });
  }
}
