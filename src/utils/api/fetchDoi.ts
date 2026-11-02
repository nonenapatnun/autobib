import { BibliographyEntry, Author } from '../../types/bibliography';

/**
 * Extracts and cleans a DOI from various input forms:
 * - 10.1016/j.jbusres.2021.03.001
 * - https://doi.org/10.1016/j.jbusres.2021.03.001
 * - http://dx.doi.org/10.1016/j.jbusres.2021.03.001
 * - doi:10.1016/j.jbusres.2021.03.001
 */
export function cleanDoiString(input: string): string {
  let cleaned = input.trim();
  cleaned = cleaned.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  cleaned = cleaned.replace(/^doi:\s*/i, '');
  return cleaned.trim();
}

export function isValidDoi(input: string): boolean {
  const cleaned = cleanDoiString(input);
  // Standard DOI pattern starts with 10.XXXX/
  return /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/i.test(cleaned);
}

export async function fetchByDoi(rawDoi: string): Promise<Partial<BibliographyEntry>> {
  const doi = cleanDoiString(rawDoi);
  if (!doi) {
    throw new Error('กรุณาระบุเลข DOI ที่ถูกต้อง');
  }

  // CrossRef public API endpoint
  const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'AutoBiblio/1.0 (mailto:academic-citation-app@example.com)'
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`ไม่พบข้อมูลสำหรับ DOI: ${doi} ในระบบ CrossRef`);
    }
    throw new Error(`เกิดข้อผิดพลาดในการดึงข้อมูล DOI (${response.status})`);
  }

  const json = await response.json();
  const item = json.message;

  if (!item) {
    throw new Error('ไม่พบข้อมูลโครงสร้างบรรณานุกรมในผลลัพธ์');
  }

  // Determine language (detect Thai characters in title)
  const title = Array.isArray(item.title) ? item.title[0] : item.title || '';
  const isThai = /[\u0E00-\u0E7F]/.test(title);

  // Extract authors
  const authors: Author[] = [];
  if (Array.isArray(item.author)) {
    for (const a of item.author) {
      if (a.name) {
        // Corporate/group author
        authors.push({
          id: Math.random().toString(36).substring(2, 9),
          firstName: a.name,
          lastName: '',
          isOrganization: true,
          isThai: /[\u0E00-\u0E7F]/.test(a.name)
        });
      } else {
        const authorIsThai = /[\u0E00-\u0E7F]/.test((a.family || '') + (a.given || ''));
        authors.push({
          id: Math.random().toString(36).substring(2, 9),
          firstName: a.given || '',
          lastName: a.family || '',
          isOrganization: false,
          isThai: authorIsThai
        });
      }
    }
  }

  // Extract publication year
  let year = '';
  let monthDay = '';
  const dateParts =
    item['published-print']?.['date-parts']?.[0] ||
    item['published-online']?.['date-parts']?.[0] ||
    item.created?.['date-parts']?.[0] ||
    item.issued?.['date-parts']?.[0];

  if (dateParts && dateParts.length > 0) {
    year = String(dateParts[0]);
    if (dateParts.length > 1) {
      const monthNum = dateParts[1];
      const dayNum = dateParts[2];
      const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];
      const engMonths = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      if (isThai) {
        monthDay = dayNum ? `${dayNum} ${thaiMonths[monthNum - 1]}` : thaiMonths[monthNum - 1];
      } else {
        monthDay = dayNum ? `${engMonths[monthNum - 1]} ${dayNum}` : engMonths[monthNum - 1];
      }
    }
  }

  // Journal or Container title
  const containerTitle = Array.isArray(item['container-title'])
    ? item['container-title'][0]
    : item['container-title'] || '';

  // Volume, issue, pages
  const volume = item.volume || '';
  const issue = item.issue || '';
  const pages = item.page || '';
  const publisher = item.publisher || '';

  // Source type mapping
  let sourceType: BibliographyEntry['sourceType'] = 'journal';
  if (item.type === 'book' || item.type === 'monograph') {
    sourceType = 'book';
  } else if (item.type === 'book-chapter' || item.type === 'book-section') {
    sourceType = 'chapter';
  } else if (item.type === 'proceedings-article') {
    sourceType = 'conference';
  } else if (item.type === 'dissertation') {
    sourceType = 'thesis';
  }

  return {
    sourceType,
    language: isThai ? 'th' : 'en',
    title: title.trim(),
    authors,
    year,
    yearType: 'CE',
    monthDay,
    containerTitle: containerTitle.trim(),
    volume: String(volume).trim(),
    issue: String(issue).trim(),
    pages: String(pages).trim(),
    publisher: publisher.trim(),
    doi: doi,
    url: item.URL || `https://doi.org/${doi}`
  };
}
