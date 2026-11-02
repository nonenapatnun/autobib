import { BibliographyEntry, FormattedSpan, Author } from '../../types/bibliography';

/**
 * Format authors for Chicago 17th Edition (Author-Date System)
 */
export function formatAuthorsChicago(authors: Author[], isThai: boolean): string {
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

  if (count === 3) {
    const andWord = isThai ? ', และ ' : ', and ';
    return `${formatOne(authors[0], true)}, ${formatOne(authors[1], false)}${andWord}${formatOne(authors[2], false)}.`;
  }

  // 4+ authors in Chicago Author-Date: First author, et al.
  const etAl = isThai ? ', และคณะ.' : ', et al.';
  return `${formatOne(authors[0], true)}${etAl}`;
}

/**
 * Format citation for Chicago 17th Edition (Author-Date)
 */
export function formatChicago(entry: BibliographyEntry): FormattedSpan[] {
  const isThai = entry.language === 'th';
  const spans: FormattedSpan[] = [];

  // 1. Author
  const authorsText = formatAuthorsChicago(entry.authors, isThai);
  if (authorsText) {
    spans.push({ text: authorsText + ' ' });
  }

  // 2. Year (directly follows author in Chicago Author-Date)
  const yearText = entry.year?.trim() || (isThai ? 'ม.ป.ป.' : 'n.d.');
  spans.push({ text: `${yearText}. ` });

  // 3. Content by source type
  switch (entry.sourceType) {
    case 'book': {
      // Book title italicized in Chicago
      spans.push({ text: entry.title.trim(), italic: true });
      spans.push({ text: '.' });

      if (entry.edition) {
        const edStr = isThai ? ` พิมพ์ครั้งที่ ${entry.edition}.` : ` ${entry.edition} ed.`;
        spans.push({ text: edStr });
      }

      if (entry.place && entry.publisher) {
        spans.push({ text: ` ${entry.place.trim()}: ${entry.publisher.trim()}.` });
      } else if (entry.publisher) {
        spans.push({ text: ` ${entry.publisher.trim()}.` });
      }

      appendDoiOrUrlChicago(entry, spans);
      break;
    }

    case 'journal': {
      // Article title in quotation marks
      spans.push({ text: `"${entry.title.trim()}." ` });

      // Journal title italicized
      if (entry.containerTitle) {
        spans.push({ text: entry.containerTitle.trim(), italic: true });
      }

      if (entry.volume) {
        spans.push({ text: ` ${entry.volume.trim()}` });
        if (entry.issue) {
          spans.push({ text: ` (${entry.issue.trim()})` });
        }
      }

      if (entry.pages) {
        spans.push({ text: `: ${entry.pages.trim()}` });
      }
      spans.push({ text: '.' });

      appendDoiOrUrlChicago(entry, spans);
      break;
    }

    case 'chapter': {
      spans.push({ text: `"${entry.title.trim()}." ` });
      const inPrefix = isThai ? 'ใน ' : 'In ';
      spans.push({ text: inPrefix });

      if (entry.containerTitle) {
        spans.push({ text: entry.containerTitle.trim(), italic: true });
      }

      if (entry.editors && entry.editors.length > 0) {
        const edText = formatAuthorsChicago(entry.editors, isThai).replace(/\.$/, '');
        const edPrefix = isThai ? ', บรรณาธิการโดย ' : ', edited by ';
        spans.push({ text: `${edPrefix}${edText}` });
      }

      if (entry.pages) {
        const pLabel = isThai ? `, น. ` : `, `;
        spans.push({ text: `${pLabel}${entry.pages.trim()}` });
      }
      spans.push({ text: '.' });

      if (entry.place && entry.publisher) {
        spans.push({ text: ` ${entry.place.trim()}: ${entry.publisher.trim()}.` });
      } else if (entry.publisher) {
        spans.push({ text: ` ${entry.publisher.trim()}.` });
      }

      appendDoiOrUrlChicago(entry, spans);
      break;
    }

    case 'website': {
      spans.push({ text: `"${entry.title.trim()}." ` });

      if (entry.containerTitle) {
        spans.push({ text: entry.containerTitle.trim(), italic: true });
        spans.push({ text: '.' });
      }

      if (entry.monthDay) {
        spans.push({ text: ` ${entry.monthDay.trim()}.` });
      }

      if (entry.url) {
        spans.push({ text: ` ${entry.url.trim()}.`, isUrl: true });
      }
      break;
    }

    case 'thesis': {
      spans.push({ text: `"${entry.title.trim()}." ` });
      const degree = entry.degreeType || (isThai ? 'วิทยานิพนธ์ปริญญามหาบัณฑิต' : "Master's thesis");
      const inst = entry.institution || entry.publisher || '';
      spans.push({ text: `${degree}, ${inst}.` });
      appendDoiOrUrlChicago(entry, spans);
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
      appendDoiOrUrlChicago(entry, spans);
      break;
    }
  }

  return spans;
}

function appendDoiOrUrlChicago(entry: BibliographyEntry, spans: FormattedSpan[]) {
  if (entry.doi) {
    const cleanDoi = entry.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '');
    spans.push({ text: ` https://doi.org/${cleanDoi}`, isUrl: true });
  } else if (entry.url) {
    spans.push({ text: ` ${entry.url.trim()}`, isUrl: true });
  }
}
