import { BibliographyEntry, FormattedSpan, Author } from '../../types/bibliography';

/**
 * Format authors for APA 7th Edition
 */
export function formatAuthorsAPA7(authors: Author[], isThai: boolean): string {
  if (!authors || authors.length === 0) {
    return isThai ? 'ไม่ปรากฏชื่อผู้แต่ง.' : 'Unknown author.';
  }

  const formattedAuthors = authors.map((a) => {
    if (a.isOrganization) {
      return a.firstName.trim();
    }
    if (a.isThai || isThai) {
      // Thai author: ชื่อ นามสกุล (no comma between first and last)
      if (a.lastName) {
        return `${a.firstName.trim()} ${a.lastName.trim()}`;
      }
      return a.firstName.trim();
    } else {
      // English/Western author: Surname, Initials.
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

  // 3 to 20 authors in APA 7: list all, with & before the last
  if (count <= 20) {
    const lastAuthor = formattedAuthors[count - 1];
    const precedingAuthors = formattedAuthors.slice(0, count - 1).join(', ');
    const ampersand = isThai ? ', และ ' : ', & ';
    return `${precedingAuthors}${ampersand}${lastAuthor}.`;
  }

  // 21+ authors: list first 19, then ellipsis ..., then last author
  const first19 = formattedAuthors.slice(0, 19).join(', ');
  const lastAuthor = formattedAuthors[count - 1];
  return `${first19}, ... ${lastAuthor}.`;
}

/**
 * Format year/date for APA 7
 */
export function formatYearAPA7(entry: BibliographyEntry): string {
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
 * Format citation for APA 7th Edition into structured spans
 */
export function formatAPA7(entry: BibliographyEntry): FormattedSpan[] {
  const isThai = entry.language === 'th';
  const spans: FormattedSpan[] = [];

  // 1. Authors
  const authorsText = formatAuthorsAPA7(entry.authors, isThai);
  spans.push({ text: authorsText + ' ' });

  // 2. Year
  const yearText = formatYearAPA7(entry);
  spans.push({ text: yearText + ' ' });

  // 3. Content according to source type
  switch (entry.sourceType) {
    case 'book': {
      // Title of book is italicized in APA
      const title = entry.title.trim();
      let titleWithDetails = title;
      if (entry.edition) {
        const edText = isThai ? ` (พิมพ์ครั้งที่ ${entry.edition})` : ` (${entry.edition} ed.)`;
        titleWithDetails += edText;
      }
      spans.push({ text: titleWithDetails + '.', italic: true });

      // Publisher (No place of publication in APA 7!)
      if (entry.publisher) {
        spans.push({ text: ` ${entry.publisher.trim()}.` });
      }

      // DOI or URL
      appendDoiOrUrlAPA7(entry, spans);
      break;
    }

    case 'journal': {
      // Title of journal article is NOT italicized
      spans.push({ text: `${entry.title.trim()}. ` });

      // Journal container title is ITALICIZED
      if (entry.containerTitle) {
        spans.push({ text: entry.containerTitle.trim(), italic: true });
      }

      // Volume is ITALICIZED, Issue is in parentheses (NOT italicized)
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
      appendDoiOrUrlAPA7(entry, spans);
      break;
    }

    case 'chapter': {
      // Chapter title is not italicized
      spans.push({ text: `${entry.title.trim()}. ` });

      // Editors and Book title
      const inWord = isThai ? 'ใน ' : 'In ';
      spans.push({ text: inWord });

      if (entry.editors && entry.editors.length > 0) {
        const edStr = formatAuthorsAPA7(entry.editors, isThai);
        const edLabel = isThai ? ' (บ.ก.), ' : ' (Ed.), ';
        spans.push({ text: `${edStr.replace(/\.$/, '')}${edLabel}` });
      }

      // Book title is italicized
      if (entry.containerTitle) {
        spans.push({ text: entry.containerTitle.trim(), italic: true });
      }

      // Pages in parentheses
      if (entry.pages) {
        const pLabel = isThai ? ` (น. ${entry.pages.trim()}).` : ` (pp. ${entry.pages.trim()}).`;
        spans.push({ text: pLabel });
      } else {
        spans.push({ text: '.' });
      }

      if (entry.publisher) {
        spans.push({ text: ` ${entry.publisher.trim()}.` });
      }

      appendDoiOrUrlAPA7(entry, spans);
      break;
    }

    case 'website': {
      // Webpage title is italicized
      spans.push({ text: entry.title.trim(), italic: true });
      spans.push({ text: '.' });

      if (entry.containerTitle) {
        spans.push({ text: ` ${entry.containerTitle.trim()}.` });
      }

      if (entry.url) {
        const urlStr = entry.url.trim();
        spans.push({ text: ` ${urlStr}`, isUrl: true });
      }
      break;
    }

    case 'thesis': {
      // Thesis title is italicized with degree bracket
      spans.push({ text: entry.title.trim(), italic: true });
      const degree = entry.degreeType || (isThai ? 'วิทยานิพนธ์ปริญญามหาบัณฑิต' : 'Master’s thesis');
      const inst = entry.institution || entry.publisher || '';
      spans.push({ text: ` [${degree}, ${inst}].` });

      if (entry.url || entry.doi) {
        appendDoiOrUrlAPA7(entry, spans);
      }
      break;
    }

    case 'conference': {
      spans.push({ text: `${entry.title.trim()}. ` });
      if (entry.containerTitle || entry.conferenceName) {
        const confName = entry.containerTitle || entry.conferenceName || '';
        spans.push({ text: confName.trim(), italic: true });
      }
      if (entry.pages) {
        spans.push({ text: ` (pp. ${entry.pages.trim()})` });
      }
      spans.push({ text: '.' });
      if (entry.publisher) {
        spans.push({ text: ` ${entry.publisher.trim()}.` });
      }
      appendDoiOrUrlAPA7(entry, spans);
      break;
    }

    default: {
      spans.push({ text: entry.title.trim(), italic: true });
      spans.push({ text: '.' });
      if (entry.publisher) spans.push({ text: ` ${entry.publisher.trim()}.` });
      appendDoiOrUrlAPA7(entry, spans);
      break;
    }
  }

  return spans;
}

function appendDoiOrUrlAPA7(entry: BibliographyEntry, spans: FormattedSpan[]) {
  if (entry.doi) {
    const cleanDoi = entry.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '');
    spans.push({ text: ` https://doi.org/${cleanDoi}`, isUrl: true });
  } else if (entry.url) {
    spans.push({ text: ` ${entry.url.trim()}`, isUrl: true });
  }
}
