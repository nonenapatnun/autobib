import { BibliographyEntry, Author } from '../../types/bibliography';

/**
 * Checks if a string is a valid web URL
 */
export function isValidUrl(input: string): boolean {
  try {
    const text = input.trim();
    if (!text.startsWith('http://') && !text.startsWith('https://')) {
      return /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(text);
    }
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Normalizes a URL input
 */
export function normalizeUrl(input: string): string {
  let cleaned = input.trim();
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  }
  return cleaned;
}

/**
 * Known Thai and International website names
 */
const KNOWN_DOMAINS: Record<string, { siteName: string; author?: string; isThai: boolean }> = {
  'thairath.co.th': { siteName: 'ไทยรัฐออนไลน์', isThai: true },
  'matichon.co.th': { siteName: 'มติชนออนไลน์', isThai: true },
  'dailynews.co.th': { siteName: 'เดลินิวส์', isThai: true },
  'thestandard.co': { siteName: 'THE STANDARD', isThai: true },
  'workpointtoday.com': { siteName: 'TODAY', isThai: true },
  'bbc.com/thai': { siteName: 'BBC News ไทย', isThai: true },
  'bbc.com': { siteName: 'BBC News', isThai: false },
  'orst.go.th': { siteName: 'สำนักงานราชบัณฑิตยสภา', author: 'สำนักงานราชบัณฑิตยสภา', isThai: true },
  'moe.go.th': { siteName: 'กระทรวงศึกษาธิการ', author: 'กระทรวงศึกษาธิการ', isThai: true },
  'moph.go.th': { siteName: 'กระทรวงสาธารณสุข', author: 'กระทรวงสาธารณสุข', isThai: true },
  'chula.ac.th': { siteName: 'จุฬาลงกรณ์มหาวิทยาลัย', isThai: true },
  'tu.ac.th': { siteName: 'มหาวิทยาลัยธรรมศาสตร์', isThai: true },
  'ku.ac.th': { siteName: 'มหาวิทยาลัยเกษตรศาสตร์', isThai: true },
  'cmu.ac.th': { siteName: 'มหาวิทยาลัยเชียงใหม่', isThai: true },
  'cnn.com': { siteName: 'CNN', isThai: false },
  'nytimes.com': { siteName: 'The New York Times', isThai: false },
  'theguardian.com': { siteName: 'The Guardian', isThai: false },
  'techcrunch.com': { siteName: 'TechCrunch', isThai: false },
  'medium.com': { siteName: 'Medium', isThai: false }
};

/**
 * Fetches and parses bibliographic metadata from any website URL
 */
export async function fetchByUrl(rawUrl: string): Promise<Partial<BibliographyEntry>> {
  const urlString = normalizeUrl(rawUrl);
  const parsedUrl = new URL(urlString);
  const hostname = parsedUrl.hostname.replace(/^www\./i, '');

  const now = new Date();
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const engMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // 1. Check if Wikipedia URL
  if (hostname.includes('wikipedia.org')) {
    const wikiResult = await fetchWikipediaMetadata(parsedUrl);
    if (wikiResult) return wikiResult;
  }

  // 2. Fetch page HTML via CORS proxy
  let html = '';
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(urlString)}`;
    const res = await fetch(proxyUrl, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      html = data.contents || '';
    }
  } catch {
    // If proxy fails, try second proxy or fallback to heuristics
    try {
      const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(urlString)}`;
      const res = await fetch(corsProxyUrl);
      if (res.ok) {
        html = await res.text();
      }
    } catch {
      // Ignore network errors and continue to heuristic fallback
    }
  }

  // 3. Parse HTML if available
  if (html) {
    const parsed = parseHtmlMetadata(html, urlString);
    if (parsed) return parsed;
  }

  // 4. Smart heuristic fallback from URL structure & domain
  return generateHeuristicMetadata(parsedUrl);
}

/**
 * Specialized Wikipedia metadata fetcher using open REST API
 */
async function fetchWikipediaMetadata(url: URL): Promise<Partial<BibliographyEntry> | null> {
  try {
    const hostParts = url.hostname.split('.');
    const lang = hostParts[0] || 'en';
    const isThai = lang === 'th';

    const match = url.pathname.match(/\/wiki\/(.+)$/);
    if (!match) return null;

    const titleEncoded = match[1];
    const apiUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titleEncoded)}`;

    const res = await fetch(apiUrl);
    if (!res.ok) return null;

    const data = await res.json();
    const title = data.title || decodeURIComponent(titleEncoded).replace(/_/g, ' ');

    let year = '';
    let monthDay = '';
    if (data.timestamp) {
      const date = new Date(data.timestamp);
      year = isThai ? String(date.getFullYear() + 543) : String(date.getFullYear());
      const monthIndex = date.getMonth();
      const day = date.getDate();
      monthDay = isThai
        ? `${day} ${['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'][monthIndex]}`
        : `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][monthIndex]} ${day}`;
    }

    const today = new Date();
    const accessDate = isThai
      ? `${today.getDate()} ${['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'][today.getMonth()]} ${today.getFullYear() + 543}`
      : `${today.getDate()} ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][today.getMonth()]} ${today.getFullYear()}`;

    const authorName = isThai ? 'ผู้ร่วมเขียนวิกิพีเดีย' : 'Wikipedia contributors';

    return {
      sourceType: 'website',
      language: isThai ? 'th' : 'en',
      title: title.trim(),
      authors: [
        {
          id: Math.random().toString(36).substring(2, 9),
          firstName: authorName,
          lastName: '',
          isOrganization: true,
          isThai: isThai
        }
      ],
      year: year || (isThai ? String(today.getFullYear() + 543) : String(today.getFullYear())),
      yearType: isThai ? 'BE' : 'CE',
      monthDay,
      containerTitle: isThai ? 'วิกิพีเดีย' : 'Wikipedia',
      publisher: 'Wikimedia Foundation',
      url: url.href,
      accessDate
    };
  } catch {
    return null;
  }
}

/**
 * Parses OpenGraph and meta tags from page HTML
 */
function parseHtmlMetadata(html: string, originalUrl: string): Partial<BibliographyEntry> | null {
  try {
    const parsedUrl = new URL(originalUrl);
    const hostname = parsedUrl.hostname.replace(/^www\./i, '');

    // Title parsing: og:title -> twitter:title -> <title>
    let title = '';
    const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
    if (ogTitleMatch) title = ogTitleMatch[1];

    if (!title) {
      const twitterTitleMatch = html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i);
      if (twitterTitleMatch) title = twitterTitleMatch[1];
    }

    if (!title) {
      const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleTagMatch) title = titleTagMatch[1];
    }

    // Clean title (remove " | SiteName" suffix)
    if (title) {
      title = title.split(/[|\-–—]/)[0].trim();
      title = decodeHtmlEntities(title);
    }

    // Site Name: og:site_name -> domain
    let siteName = '';
    const ogSiteMatch = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i);
    if (ogSiteMatch) siteName = decodeHtmlEntities(ogSiteMatch[1].trim());

    if (!siteName && KNOWN_DOMAINS[hostname]) {
      siteName = KNOWN_DOMAINS[hostname].siteName;
    }
    if (!siteName) {
      siteName = hostname;
    }

    // Language detection
    const isThai = /[\u0E00-\u0E7F]/.test(title + siteName);

    // Author: author -> article:author -> dc.creator
    let authorName = '';
    const authorMatch =
      html.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+property=["']article:author["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+name=["']dc\.creator["'][^>]+content=["']([^"']+)["']/i);
    if (authorMatch) {
      authorName = decodeHtmlEntities(authorMatch[1].trim());
    }

    const authors: Author[] = [];
    if (authorName) {
      const authorIsThai = /[\u0E00-\u0E7F]/.test(authorName);
      if (authorIsThai) {
        authors.push({
          id: Math.random().toString(36).substring(2, 9),
          firstName: authorName,
          lastName: '',
          isOrganization: false,
          isThai: true
        });
      } else {
        const parts = authorName.split(/\s+/);
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
            firstName: authorName,
            lastName: '',
            isOrganization: false,
            isThai: false
          });
        }
      }
    } else if (KNOWN_DOMAINS[hostname]?.author) {
      authors.push({
        id: Math.random().toString(36).substring(2, 9),
        firstName: KNOWN_DOMAINS[hostname].author!,
        lastName: '',
        isOrganization: true,
        isThai: isThai
      });
    }

    // Date: article:published_time -> date -> pubdate
    let year = '';
    let monthDay = '';
    const dateMatch =
      html.match(/<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+name=["']date["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+name=["']pubdate["'][^>]+content=["']([^"']+)["']/i);

    if (dateMatch) {
      const parsedDate = new Date(dateMatch[1]);
      if (!isNaN(parsedDate.getTime())) {
        year = isThai ? String(parsedDate.getFullYear() + 543) : String(parsedDate.getFullYear());
        const mIdx = parsedDate.getMonth();
        const d = parsedDate.getDate();
        monthDay = isThai
          ? `${d} ${['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'][mIdx]}`
          : `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][mIdx]} ${d}`;
      }
    }

    // Access Date
    const today = new Date();
    const accessDate = isThai
      ? `${today.getDate()} ${['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'][today.getMonth()]} ${today.getFullYear() + 543}`
      : `${today.getDate()} ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][today.getMonth()]} ${today.getFullYear()}`;

    return {
      sourceType: 'website',
      language: isThai ? 'th' : 'en',
      title: title || siteName,
      authors,
      year: year || (isThai ? String(today.getFullYear() + 543) : String(today.getFullYear())),
      yearType: isThai ? 'BE' : 'CE',
      monthDay,
      containerTitle: siteName,
      url: originalUrl,
      accessDate
    };
  } catch {
    return null;
  }
}

/**
 * Heuristic metadata extraction from URL structure
 */
function generateHeuristicMetadata(url: URL): Partial<BibliographyEntry> {
  const hostname = url.hostname.replace(/^www\./i, '');
  const known = KNOWN_DOMAINS[hostname];

  const siteName = known?.siteName || formatHostname(hostname);
  const isThai = known?.isThai || /[\u0E00-\u0E7F]/.test(siteName);

  // Extract title from pathname
  let title = '';
  const pathSegments = url.pathname.split('/').filter(Boolean);
  if (pathSegments.length > 0) {
    const last = pathSegments[pathSegments.length - 1];
    const cleanLast = last.replace(/\.[a-zA-Z0-9]+$/, '').replace(/[-_]/g, ' ');
    if (cleanLast.length > 3) {
      title = decodeURIComponent(cleanLast);
      // Capitalize first letters
      title = title.replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }

  if (!title) {
    title = `หน้าเว็บ ${siteName}`;
  }

  const today = new Date();
  const year = isThai ? String(today.getFullYear() + 543) : String(today.getFullYear());
  const accessDate = isThai
    ? `${today.getDate()} ${['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'][today.getMonth()]} ${today.getFullYear() + 543}`
    : `${today.getDate()} ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][today.getMonth()]} ${today.getFullYear()}`;

  const authors: Author[] = [];
  if (known?.author) {
    authors.push({
      id: Math.random().toString(36).substring(2, 9),
      firstName: known.author,
      lastName: '',
      isOrganization: true,
      isThai: isThai
    });
  }

  return {
    sourceType: 'website',
    language: isThai ? 'th' : 'en',
    title,
    authors,
    year,
    yearType: isThai ? 'BE' : 'CE',
    containerTitle: siteName,
    url: url.href,
    accessDate
  };
}

function formatHostname(hostname: string): string {
  const parts = hostname.split('.');
  if (parts.length > 1) {
    return parts[parts.length - 2].charAt(0).toUpperCase() + parts[parts.length - 2].slice(1);
  }
  return hostname;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');
}
