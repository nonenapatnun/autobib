import { BibliographyEntry, FormattedSpan, Author } from '../../types/bibliography';

/**
 * Format authors for MLA 9th Edition
 * Rule: 1 author: Last, First.
 * 2 authors: Last, First, and First Last.
 * 3+ authors: Last, First, et al.
 */
export function formatAuthorsMLA(authors: Author[], isThai: boolean): string {
  if (!authors || authors.length === 0) {
    return '';
  }

  const formatOne = (a: Author, invert = true) => {
    if (a.isOrganization) return a.firstName.trim();
    if (a.isThai || isThai) {
      if (a.lastName) return `${a.firstName.trim()} ${a.lastName.trim()}`;
      return a.firstName.trim();
    }
    const last = a.lastName.trim();
    const first = a.firstName.trim();
    if (invert) {
      return last && first ? `${last}, ${first}` : last || first;
    } else {
      return last && first ? `${first} ${last}` : last || first;
    }
  };

  const count = authors.length;

  if (count === 1) {
    return `${formatOne(authors[0], true)}.`;
  }

  if (count === 2) {
    const andWord = isThai ? ' และ ' : ', and ';
    return `${formatOne(authors[0], true)}${andWord}${formatOne(authors[1], false)}.`;
  }

  // 3+ authors in MLA: First author + et al. / และคณะ
  const etAl = isThai ? ', และคณะ.' : ', et al.';
  return `${formatOne(authors[0], true)}${etAl}`;
}

/**
 * Format citation for MLA 9th Edition into structured spans
 */
export function formatMLA(entry: BibliographyEntry): FormattedSpan[] {
  const isThai = entry.language === 'th';
  const spans: FormattedSpan[] = [];

  // 1. Author
  const authorsText = formatAuthorsMLA(entry.authors, isThai);
  if (authorsText) {
    spans.push({ text: authorsText + ' ' });
  }

  // 2. Content according to source type
  switch (entry.sourceType) {
    case 'book': {
      // Book title is italicized in MLA
      spans.push({ text: entry.title.trim(), italic: true });
      spans.push({ text: '.' });

      if (entry.edition) {
        const edStr = isThai ? ` พิมพ์ครั้งที่ ${entry.edition},` : ` ${entry.edition} ed.,`;
        spans.push({ text: edStr });
      }

      if (entry.publisher) {
        spans.push({ text: ` ${entry.publisher.trim()},` });
      }

      if (entry.year) {
        spans.push({ text: ` ${entry.year.trim()}.` });
      }

      appendDoiOrUrlMLA(entry, spans);
      break;
    }

    case 'journal': {
      // Journal article title in quotation marks
      spans.push({ text: `"${entry.title.trim()}." ` });

      // Journal title italicized
      if (entry.containerTitle) {
        spans.push({ text: entry.containerTitle.trim(), italic: true });
      }

      // Volume & Issue
      if (entry.volume) {
        const volStr = isThai ? `, ปีที่ ${entry.volume.trim()}` : `, vol. ${entry.volume.trim()}`;
        spans.push({ text: volStr });
      }

      if (entry.issue) {
        const issStr = isThai ? `, ฉบับที่ ${entry.issue.trim()}` : `, no. ${entry.issue.trim()}`;
        spans.push({ text: issStr });
      }

      if (entry.year) {
        spans.push({ text: `, ${entry.year.trim()}` });
      }

      if (entry.pages) {
        const isSinglePage = !entry.pages.includes('-') && !entry.pages.includes('–');
        const pLabel = isThai ? `, หน้า ` : isSinglePage ? `, p. ` : `, pp. `;
        spans.push({ text: `${pLabel}${entry.pages.trim()}` });
      }

      spans.push({ text: '.' });
      appendDoiOrUrlMLA(entry, spans);
      break;
    }

    case 'chapter': {
      // Chapter title in quotes
      spans.push({ text: `"${entry.title.trim()}." ` });

      // Book title italicized
      if (entry.containerTitle) {
        spans.push({ text: entry.containerTitle.trim(), italic: true });
        spans.push({ text: ',' });
      }

      // Editor
      if (entry.editors && entry.editors.length > 0) {
        const edText = formatAuthorsMLA(entry.editors, isThai).replace(/\.$/, '');
        const edPrefix = isThai ? ' บรรณาธิการโดย ' : ' edited by ';
        spans.push({ text: `${edPrefix}${edText},` });
      }

      if (entry.publisher) {
        spans.push({ text: ` ${entry.publisher.trim()},` });
      }

      if (entry.year) {
        spans.push({ text: ` ${entry.year.trim()},` });
      }

      if (entry.pages) {
        const isSinglePage = !entry.pages.includes('-') && !entry.pages.includes('–');
        const pLabel = isThai ? ` หน้า ` : isSinglePage ? ` p. ` : ` pp. `;
        spans.push({ text: `${pLabel}${entry.pages.trim()}.` });
      }

      appendDoiOrUrlMLA(entry, spans);
      break;
    }

    case 'website': {
      // Page title in quotes
      spans.push({ text: `"${entry.title.trim()}." ` });

      // Website name in italics
      if (entry.containerTitle) {
        spans.push({ text: entry.containerTitle.trim(), italic: true });
        spans.push({ text: ',' });
      }

      if (entry.publisher && entry.publisher !== entry.containerTitle) {
        spans.push({ text: ` ${entry.publisher.trim()},` });
      }

      if (entry.monthDay && entry.year) {
        spans.push({ text: ` ${entry.monthDay.trim()} ${entry.year.trim()},` });
      } else if (entry.year) {
        spans.push({ text: ` ${entry.year.trim()},` });
      }

      if (entry.url) {
        spans.push({ text: ` ${entry.url.trim()}.`, isUrl: true });
      }

      if (entry.accessDate) {
        const accPrefix = isThai ? ` เข้าถึงเมื่อ ${entry.accessDate}.` : ` Accessed ${entry.accessDate}.`;
        spans.push({ text: accPrefix });
      }
      break;
    }

    case 'thesis': {
      spans.push({ text: entry.title.trim(), italic: true });
      const degree = entry.degreeType || (isThai ? 'วิทยานิพนธ์ปริญญามหาบัณฑิต' : 'Master’s thesis');
      const inst = entry.institution || entry.publisher || '';
      spans.push({ text: `. ${degree}, ${inst}` });
      if (entry.year) {
        spans.push({ text: `, ${entry.year.trim()}` });
      }
      spans.push({ text: '.' });
      appendDoiOrUrlMLA(entry, spans);
      break;
    }

    default: {
      spans.push({ text: entry.title.trim(), italic: true });
      spans.push({ text: '.' });
      if (entry.publisher) spans.push({ text: ` ${entry.publisher.trim()},` });
      if (entry.year) spans.push({ text: ` ${entry.year.trim()}.` });
      appendDoiOrUrlMLA(entry, spans);
      break;
    }
  }

  return spans;
}

function appendDoiOrUrlMLA(entry: BibliographyEntry, spans: FormattedSpan[]) {
  if (entry.doi) {
    const cleanDoi = entry.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '');
    spans.push({ text: ` https://doi.org/${cleanDoi}`, isUrl: true });
  } else if (entry.url) {
    spans.push({ text: ` ${entry.url.trim()}`, isUrl: true });
  }
}
