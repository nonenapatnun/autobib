import { BibliographyEntry, SourceType, LanguageType, Author } from '../../types/bibliography';

export interface GroundingSource {
  title: string;
  url: string;
}

export interface GroundingSearchResultItem {
  sourceType?: SourceType;
  language?: LanguageType;
  title: string;
  authors?: Array<{
    firstName: string;
    lastName?: string;
    isOrganization?: boolean;
    isThai?: boolean;
  }>;
  year?: string;
  yearType?: 'CE' | 'BE';
  containerTitle?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  publisher?: string;
  place?: string;
  institution?: string;
  degreeType?: string;
  doi?: string;
  isbn?: string;
  url?: string;
  snippet?: string;
  confidence?: 'high' | 'medium';
}

export interface SearchGroundingResponse {
  success: boolean;
  query: string;
  items: GroundingSearchResultItem[];
  sources: GroundingSource[];
  webSearchQueries?: string[];
  error?: string;
}

/**
 * Searches academic and bibliographic data using Google Search Grounding via the backend API.
 */
export async function searchCitationsWithGrounding(
  query: string
): Promise<SearchGroundingResponse> {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error('กรุณาระบุคำค้นหา (ชื่อบทความ หนังสือ ผู้แต่ง หรือหัวข้อ)');
  }

  const response = await fetch('/api/citation/search-grounding', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: trimmed }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.error || `เกิดข้อผิดพลาดในการค้นหา (${response.status} ${response.statusText})`
    );
  }

  const data: SearchGroundingResponse = await response.json();
  return data;
}

/**
 * Converts a GroundingSearchResultItem into a complete BibliographyEntry ready to be saved.
 */
export function convertToBibliographyEntry(
  item: GroundingSearchResultItem,
  defaultLanguage: LanguageType = 'th'
): BibliographyEntry {
  // Detect language if not specified
  const hasThai = /[\u0E00-\u0E7F]/.test(
    `${item.title} ${item.containerTitle || ''} ${item.publisher || ''}`
  );
  const lang: LanguageType = item.language || (hasThai ? 'th' : 'en');

  // Format authors
  const authors: Author[] = (item.authors && item.authors.length > 0)
    ? item.authors.map((a, idx) => ({
        id: `author-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        firstName: (a.firstName || '').trim(),
        lastName: (a.lastName || '').trim(),
        isOrganization: !!a.isOrganization,
        isThai: a.isThai !== undefined ? a.isThai : /[\u0E00-\u0E7F]/.test(a.firstName + (a.lastName || '')),
      }))
    : [
        {
          id: `author-${Date.now()}-0`,
          firstName: lang === 'th' ? 'ไม่ระบุผู้แต่ง' : 'Unknown Author',
          lastName: '',
          isOrganization: false,
          isThai: lang === 'th',
        },
      ];

  // Determine year and yearType
  let yearStr = (item.year || '').trim();
  let yearType: 'CE' | 'BE' = item.yearType || 'CE';
  
  const numYear = parseInt(yearStr.replace(/\D/g, ''), 10);
  if (!isNaN(numYear)) {
    if (numYear > 2400) {
      yearType = 'BE';
      yearStr = numYear.toString();
    } else if (numYear > 1500) {
      yearType = 'CE';
      yearStr = numYear.toString();
    }
  } else if (!yearStr) {
    yearStr = lang === 'th' ? 'ม.ป.ป.' : 'n.d.';
  }

  // Format DOI
  let cleanDoi = item.doi?.trim();
  if (cleanDoi) {
    cleanDoi = cleanDoi.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '');
  }

  // Determine SourceType
  let finalSourceType: SourceType = item.sourceType || 'journal';
  if (item.institution || item.degreeType) {
    finalSourceType = 'thesis';
  } else if (item.isbn && !item.containerTitle) {
    finalSourceType = 'book';
  } else if (item.url && !item.containerTitle && !item.publisher) {
    finalSourceType = 'website';
  }

  return {
    id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    sourceType: finalSourceType,
    language: lang,
    title: item.title.trim() || 'ไม่มีชื่อเรื่อง',
    authors,
    year: yearStr,
    yearType,
    containerTitle: item.containerTitle?.trim() || undefined,
    volume: item.volume?.trim() || undefined,
    issue: item.issue?.trim() || undefined,
    pages: item.pages?.trim() || undefined,
    publisher: item.publisher?.trim() || undefined,
    place: item.place?.trim() || undefined,
    institution: item.institution?.trim() || undefined,
    degreeType: item.degreeType?.trim() || undefined,
    doi: cleanDoi || undefined,
    isbn: item.isbn?.trim() || undefined,
    url: item.url?.trim() || undefined,
    accessDate:
      lang === 'th'
        ? `สืบค้นเมื่อ ${new Date().toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}`
        : `Retrieved ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
