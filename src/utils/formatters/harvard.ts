import { BibliographyEntry, FormattedSpan, Author } from '../../types/bibliography';

/**
 * Format authors for Harvard Style
 */
export function formatAuthorsHarvard(authors: Author[], isThai: boolean): string {
  if (!authors || authors.length === 0) {
    return isThai ? 'ไม่ปรากฏชื่อผู้แต่ง' : 'Anon.';
  }

  const formatOne = (a: Author) => {
    if (a.isOrganization) return a.firstName.trim();
    if (a.isThai || isThai) {
      if (a.lastName) return `${a.firstName.trim()} ${a.lastName.trim()}`;
      return a.firstName.trim();
    }
    const last = a.lastName.trim();
    const firstNames = a.firstName.trim().split(/\s+/);
    const initials = firstNames
      .filter(Boolean)
      .map((n) => (n.endsWith('.') ? n : `${n[0].toUpperCase()}.`))
      .join('');
    return last && initials ? `${last}, ${initials}` : last || a.firstName.trim();
  };

  const count = authors.length;

  if (count === 1) {
    return `${formatOne(authors[0])}`;
  }

  if (count === 2) {
    const andWord = isThai ? ' และ ' : ' and ';
    return `${formatOne(authors[0])}${andWord}${formatOne(authors[1])}`;
  }

  // 3+ authors in Harvard: First author et al.
  const etAl = isThai ? ' และคณะ' : ' et al.';
  return `${formatOne(authors[0])}${etAl}`;
}

/**
 * Format citation for Harvard Style
 */
export function formatHarvard(entry: BibliographyEntry): FormattedSpan[] {
  const isThai = entry.language === 'th';
  const spans: FormattedSpan[] = [];

  // 1. Author
  const authorsText = formatAuthorsHarvard(entry.authors, isThai);
  spans.push({ text: authorsText + ' ' });

  // 2. Year (Year)
  const yearText = entry.year?.trim() || (isThai ? 'ม.ป.ป.' : 'n.d.');
  spans.push({ text: `(${yearText}) ` });

  // 3. Content
  switch (entry.sourceType) {
    case 'book': {
      // Book title italicized
      spans.push({ text: entry.title.trim(), italic: true });
      spans.push({ text: '.' });

      if (entry.edition) {
        const edStr = isThai ? ` พิมพ์ครั้งที่ ${entry.edition}.` : ` ${entry.edition} edn.`;
        spans.push({ text: edStr });
      }

      if (entry.place && entry.publisher) {
        spans.push({ text: ` ${entry.place.trim()}: ${entry.publisher.trim()}.` });
      } else if (entry.publisher) {
        spans.push({ text: ` ${entry.publisher.trim()}.` });
      }

      appendDoiOrUrlHarvard(entry, spans);
      break;
    }

    case 'journal': {
      // Article title in single quotation marks followed by comma
      spans.push({ text: `'${entry.title.trim()}', ` });

      // Journal title in italics
      if (entry.containerTitle) {
        spans.push({ text: entry.containerTitle.trim(), italic: true });
      }

      if (entry.volume) {
        spans.push({ text: `, ${entry.volume.trim()}` });
        if (entry.issue) {
          spans.push({ text: `(${entry.issue.trim()})` });
        }
      }

      if (entry.pages) {
        const isSingle = !entry.pages.includes('-') && !entry.pages.includes('–');
        const pLabel = isThai ? ', น. ' : isSingle ? ', p. ' : ', pp. ';
        spans.push({ text: `${pLabel}${entry.pages.trim()}` });
      }
      spans.push({ text: '.' });

      appendDoiOrUrlHarvard(entry, spans);
      break;
    }

    case 'chapter': {
      spans.push({ text: `'${entry.title.trim()}', ` });
      const inPrefix = isThai ? 'ใน ' : 'in ';
      spans.push({ text: inPrefix });

      if (entry.editors && entry.editors.length > 0) {
        const edText = formatAuthorsHarvard(entry.editors, isThai);
        const edLabel = isThai ? ' (บ.ก.) ' : ' (ed.) ';
        spans.push({ text: `${edText}${edLabel}` });
      }

      if (entry.containerTitle) {
        spans.push({ text: entry.containerTitle.trim(), italic: true });
        spans.push({ text: '.' });
      }

      if (entry.place && entry.publisher) {
        spans.push({ text: ` ${entry.place.trim()}: ${entry.publisher.trim()}` });
      }

      if (entry.pages) {
        const pLabel = isThai ? ', น. ' : ', pp. ';
        spans.push({ text: `${pLabel}${entry.pages.trim()}` });
      }
      spans.push({ text: '.' });

      appendDoiOrUrlHarvard(entry, spans);
      break;
    }

    case 'website': {
      spans.push({ text: entry.title.trim(), italic: true });
      spans.push({ text: '.' });

      if (entry.containerTitle) {
        spans.push({ text: ` ${entry.containerTitle.trim()}.` });
      }

      if (entry.url) {
        const availPrefix = isThai ? ' เข้าถึงได้ที่: ' : ' Available at: ';
        spans.push({ text: availPrefix });
        spans.push({ text: entry.url.trim(), isUrl: true });
      }

      if (entry.accessDate) {
        const accPrefix = isThai ? ` (สืบค้นเมื่อ: ${entry.accessDate}).` : ` (Accessed: ${entry.accessDate}).`;
        spans.push({ text: accPrefix });
      }
      break;
    }

    case 'thesis': {
      spans.push({ text: entry.title.trim(), italic: true });
      const degree = entry.degreeType || (isThai ? 'วิทยานิพนธ์ปริญญามหาบัณฑิต' : "Master's thesis");
      const inst = entry.institution || entry.publisher || '';
      spans.push({ text: `. ${degree}. ${inst}.` });
      appendDoiOrUrlHarvard(entry, spans);
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
      appendDoiOrUrlHarvard(entry, spans);
      break;
    }
  }

  return spans;
}

function appendDoiOrUrlHarvard(entry: BibliographyEntry, spans: FormattedSpan[]) {
  if (entry.doi) {
    const cleanDoi = entry.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '');
    spans.push({ text: ` doi:${cleanDoi}` });
  } else if (entry.url) {
    spans.push({ text: ` Available at: ${entry.url.trim()}`, isUrl: true });
  }
}
