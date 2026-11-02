import { BibliographyEntry, Author } from '../../types/bibliography';

/**
 * Cleans an ISBN string: removes hyphens, spaces, and 'ISBN' prefix
 */
export function cleanIsbnString(input: string): string {
  let cleaned = input.trim().replace(/^isbn[:\s]*/i, '');
  return cleaned.replace(/[-\s]/g, '').trim();
}

export function isValidIsbn(input: string): boolean {
  const cleaned = cleanIsbnString(input);
  return /^(97[89])?\d{9}[\dX]$/i.test(cleaned);
}

export async function fetchByIsbn(rawIsbn: string): Promise<Partial<BibliographyEntry>> {
  const isbn = cleanIsbnString(rawIsbn);
  if (!isbn) {
    throw new Error('กรุณาระบุเลข ISBN ที่ถูกต้อง');
  }

  // First try Google Books API
  try {
    const gbooksUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}`;
    const gResponse = await fetch(gbooksUrl);

    if (gResponse.ok) {
      const gData = await gResponse.json();
      if (gData.items && gData.items.length > 0) {
        const volumeInfo = gData.items[0].volumeInfo;
        const entry = await parseGoogleBooksVolume(volumeInfo, isbn);
        if (entry) return entry;
      }
    }
  } catch {
    // If Google Books fails, try OpenLibrary below
  }

  // Fallback to Open Library API
  try {
    const olUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(isbn)}&format=json&jscmd=data`;
    const olResponse = await fetch(olUrl);
    if (olResponse.ok) {
      const olData = await olResponse.json();
      const key = `ISBN:${isbn}`;
      if (olData[key]) {
        return parseOpenLibraryData(olData[key], isbn);
      }
    }
  } catch (err) {
    console.error('OpenLibrary API error:', err);
  }

  throw new Error(`ไม่พบข้อมูลหนังสือสำหรับ ISBN: ${isbn} ในฐานข้อมูล Google Books หรือ Open Library`);
}

async function parseGoogleBooksVolume(
  vol: any,
  isbn: string
): Promise<Partial<BibliographyEntry>> {
  const title = vol.title || '';
  const subtitle = vol.subtitle ? `: ${vol.subtitle}` : '';
  const fullTitle = `${title}${subtitle}`.trim();
  const isThai = /[\u0E00-\u0E7F]/.test(fullTitle);

  // Authors
  const authors: Author[] = [];
  if (Array.isArray(vol.authors)) {
    for (const name of vol.authors) {
      const authorIsThai = /[\u0E00-\u0E7F]/.test(name);
      if (authorIsThai) {
        // Thai names are usually single string "ชื่อ นามสกุล"
        authors.push({
          id: Math.random().toString(36).substring(2, 9),
          firstName: name.trim(),
          lastName: '',
          isOrganization: false,
          isThai: true
        });
      } else {
        // Western names: "Firstname Lastname" or "Lastname, Firstname"
        if (name.includes(',')) {
          const [last, first] = name.split(',').map((s: string) => s.trim());
          authors.push({
            id: Math.random().toString(36).substring(2, 9),
            firstName: first,
            lastName: last,
            isOrganization: false,
            isThai: false
          });
        } else {
          const parts = name.trim().split(/\s+/);
          if (parts.length > 1) {
            const last = parts.pop()!;
            const first = parts.join(' ');
            authors.push({
              id: Math.random().toString(36).substring(2, 9),
              firstName: first,
              lastName: last,
              isOrganization: false,
              isThai: false
            });
          } else {
            authors.push({
              id: Math.random().toString(36).substring(2, 9),
              firstName: name.trim(),
              lastName: '',
              isOrganization: false,
              isThai: false
            });
          }
        }
      }
    }
  }

  // Year from publishedDate (e.g. "2018-05-12" or "2018")
  let year = '';
  if (vol.publishedDate) {
    const match = vol.publishedDate.match(/^(\d{4})/);
    if (match) {
      year = match[1];
    }
  }

  // Publisher
  const publisher = vol.publisher || '';

  // Try to find place of publication if available from OpenLibrary
  let place = '';
  try {
    const olUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
    const res = await fetch(olUrl);
    if (res.ok) {
      const data = await res.json();
      const olBook = data[`ISBN:${isbn}`];
      if (olBook?.publish_places && olBook.publish_places.length > 0) {
        place = olBook.publish_places[0].name || '';
      }
    }
  } catch {
    // Ignore optional place lookup
  }

  return {
    sourceType: 'book',
    language: isThai ? 'th' : 'en',
    title: fullTitle,
    authors,
    year,
    yearType: 'CE',
    publisher: publisher.trim(),
    place: place.trim(),
    isbn: isbn,
    pages: vol.pageCount ? String(vol.pageCount) : undefined
  };
}

function parseOpenLibraryData(data: any, isbn: string): Partial<BibliographyEntry> {
  const title = data.title || '';
  const subtitle = data.subtitle ? `: ${data.subtitle}` : '';
  const fullTitle = `${title}${subtitle}`.trim();
  const isThai = /[\u0E00-\u0E7F]/.test(fullTitle);

  const authors: Author[] = [];
  if (Array.isArray(data.authors)) {
    for (const a of data.authors) {
      const name = a.name || '';
      const authorIsThai = /[\u0E00-\u0E7F]/.test(name);
      if (authorIsThai) {
        authors.push({
          id: Math.random().toString(36).substring(2, 9),
          firstName: name.trim(),
          lastName: '',
          isOrganization: false,
          isThai: true
        });
      } else {
        const parts = name.trim().split(/\s+/);
        if (parts.length > 1) {
          const last = parts.pop()!;
          const first = parts.join(' ');
          authors.push({
            id: Math.random().toString(36).substring(2, 9),
            firstName: first,
            lastName: last,
            isOrganization: false,
            isThai: false
          });
        } else {
          authors.push({
            id: Math.random().toString(36).substring(2, 9),
            firstName: name.trim(),
            lastName: '',
            isOrganization: false,
            isThai: false
          });
        }
      }
    }
  }

  let year = '';
  if (data.publish_date) {
    const match = data.publish_date.match(/\b(\d{4})\b/);
    if (match) year = match[1];
  }

  let publisher = '';
  if (Array.isArray(data.publishers) && data.publishers.length > 0) {
    publisher = data.publishers[0].name || '';
  }

  let place = '';
  if (Array.isArray(data.publish_places) && data.publish_places.length > 0) {
    place = data.publish_places[0].name || '';
  }

  return {
    sourceType: 'book',
    language: isThai ? 'th' : 'en',
    title: fullTitle,
    authors,
    year,
    yearType: 'CE',
    publisher: publisher.trim(),
    place: place.trim(),
    isbn: isbn,
    pages: data.number_of_pages ? String(data.number_of_pages) : undefined
  };
}
