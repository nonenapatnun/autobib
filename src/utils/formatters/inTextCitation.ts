import { BibliographyEntry, CitationStyle, Author } from '../../types/bibliography';

export interface InTextCitationResult {
  parenthetical: string;
  narrative: string;
}

export function generateInTextCitation(
  entry: BibliographyEntry,
  style: CitationStyle,
  indexNumber: number = 1
): InTextCitationResult {
  const isThai = entry.language === 'th';
  const authors = entry.authors || [];
  const year = entry.year?.trim() || (isThai ? 'ม.ป.ป.' : 'n.d.');
  const page = entry.pages ? entry.pages.split(/[-–,]/)[0].trim() : '';

  // Vancouver style: Numbered citation [1] or (1)
  if (style === 'vancouver') {
    const num = entry.citationNumber || indexNumber;
    return {
      parenthetical: `[${num}]`,
      narrative: `[${num}]`
    };
  }

  // Get author short names
  const authorNames = authors.map((a) => {
    if (a.isOrganization) return a.firstName.trim();
    if (a.isThai || isThai) {
      // Thai in-text citation uses Firstname (or Firstname Lastname)
      return a.lastName ? `${a.firstName.trim()} ${a.lastName.trim()}` : a.firstName.trim();
    }
    // English in-text citation uses Surname only
    return a.lastName.trim() || a.firstName.trim();
  });

  const count = authorNames.length;
  let authorParenthetical = '';
  let authorNarrative = '';

  if (count === 0) {
    const shortTitle = entry.title.length > 25 ? `"${entry.title.substring(0, 22)}..."` : `"${entry.title}"`;
    authorParenthetical = shortTitle;
    authorNarrative = shortTitle;
  } else if (count === 1) {
    authorParenthetical = authorNames[0];
    authorNarrative = authorNames[0];
  } else if (count === 2) {
    const andWord = isThai ? ' และ ' : style === 'apa7' || style === 'apa6' ? ' & ' : ' and ';
    const narrAndWord = isThai ? ' และ ' : ' and ';
    authorParenthetical = `${authorNames[0]}${andWord}${authorNames[1]}`;
    authorNarrative = `${authorNames[0]}${narrAndWord}${authorNames[1]}`;
  } else {
    // 3 or more authors
    const etAl = isThai ? ' และคณะ' : ' et al.';
    authorParenthetical = `${authorNames[0]}${etAl}`;
    authorNarrative = `${authorNames[0]}${etAl}`;
  }

  if (style === 'mla9') {
    const pageSuffix = page ? (isThai ? ` หน้า ${page}` : ` ${page}`) : '';
    return {
      parenthetical: `(${authorParenthetical}${pageSuffix})`,
      narrative: `${authorNarrative}${page ? ` (หน้า ${page})` : ''}`
    };
  }

  if (style === 'chicago') {
    const pageSuffix = page ? `, ${page}` : '';
    return {
      parenthetical: `(${authorParenthetical} ${year}${pageSuffix})`,
      narrative: `${authorNarrative} (${year}${pageSuffix})`
    };
  }

  if (style === 'harvard') {
    const pageSuffix = page ? (isThai ? `, น. ${page}` : `, p. ${page}`) : '';
    return {
      parenthetical: `(${authorParenthetical}, ${year}${pageSuffix})`,
      narrative: `${authorNarrative} (${year}${pageSuffix})`
    };
  }

  // APA 6 & 7 default
  return {
    parenthetical: `(${authorParenthetical}, ${year})`,
    narrative: `${authorNarrative} (${year})`
  };
}
