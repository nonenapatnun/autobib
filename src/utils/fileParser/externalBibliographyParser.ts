import { Author, BibliographyEntry, SourceType } from '../../types/bibliography';

export interface ParsedExternalEntry {
  entry: BibliographyEntry;
  rawText: string;
  sourceFormat: 'bibtex' | 'ris' | 'json' | 'csv' | 'docx' | 'txt';
}

export interface ExternalFileParseResult {
  fileName: string;
  detectedFormat: 'bibtex' | 'ris' | 'json' | 'csv' | 'docx' | 'txt';
  entries: ParsedExternalEntry[];
  warnings: string[];
}

function isThaiText(text: string): boolean {
  return /[\u0E00-\u0E7F]/.test(text);
}

function makeId(): string {
  return 'ext-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
}

function makeAuthorId(): string {
  return 'auth-' + Math.random().toString(36).substring(2, 9);
}

/**
 * Parse author string(s) into Author[]
 */
export function parseAuthorList(rawAuthors: string | string[]): Author[] {
  const list: string[] = Array.isArray(rawAuthors)
    ? rawAuthors
    : rawAuthors
        .split(/\s+(?:and|&|และ)\s+|;\s*|\n+/i)
        .map((s) => s.trim())
        .filter(Boolean);

  const authors: Author[] = [];

  for (const raw of list) {
    const clean = raw.replace(/^[\d.\-*•]+\s*/, '').trim();
    if (!clean) continue;

    const isThai = isThaiText(clean);

    // Check if likely organization
    if (
      /กระทรวง|กรม|สำนักงาน|มหาวิทยาลัย|สถาบัน|มูลนิธิ|สมาคม|องค์การ|ศูนย์|คณะ|ธนาคาร|บริษัท|Ministry|Department|University|Institute|Organization|Association|WHO|UNESCO|UNICEF|Bank|Corporation/i.test(
        clean
      )
    ) {
      authors.push({
        id: makeAuthorId(),
        firstName: clean,
        lastName: '',
        isOrganization: true,
        isThai,
      });
      continue;
    }

    if (clean.includes(',')) {
      // Format: Last, First
      const [last, ...rest] = clean.split(',').map((p) => p.trim());
      const first = rest.join(' ').trim();
      authors.push({
        id: makeAuthorId(),
        firstName: first || last,
        lastName: first ? last : '',
        isOrganization: false,
        isThai,
      });
    } else {
      const parts = clean
        .replace(/^(ดร\.|ศ\.ดร\.|รศ\.ดร\.|ผศ\.ดร\.|ศ\.|รศ\.|ผศ\.|นาย|นาง|นางสาว|น\.ส\.|พระมหา|พระครู)\s*/i, '')
        .trim()
        .split(/\s+/);
      if (parts.length === 1) {
        authors.push({
          id: makeAuthorId(),
          firstName: parts[0],
          lastName: '',
          isOrganization: false,
          isThai,
        });
      } else {
        const firstName = parts[0];
        const lastName = parts.slice(1).join(' ');
        authors.push({
          id: makeAuthorId(),
          firstName,
          lastName,
          isOrganization: false,
          isThai,
        });
      }
    }
  }

  return authors;
}

/**
 * 1. Parse BibTeX (.bib)
 */
export function parseBibTeXContent(content: string): ParsedExternalEntry[] {
  const results: ParsedExternalEntry[] = [];
  const entryRegex = /@(\w+)\s*\{\s*([^,]*),([\s\S]*?)\n\s*\}/g;
  let match: RegExpExecArray | null;

  // Fallback if single-line braces
  const blocks = content
    .split(/(?=@\w+\s*\{)/g)
    .map((b) => b.trim())
    .filter((b) => b.startsWith('@'));

  const processBlock = (rawBlock: string) => {
    const typeMatch = rawBlock.match(/^@(\w+)\s*\{/i);
    if (!typeMatch) return;
    const rawType = typeMatch[1].toLowerCase();
    if (rawType === 'comment' || rawType === 'preamble' || rawType === 'string') return;

    const fields: Record<string, string> = {};
    const fieldRegex = /(\w+)\s*=\s*(?:\{((?:[^{}]|\{[^{}]*\})*)\}|"([^"]*)"|(\d+))/g;
    let fMatch: RegExpExecArray | null;
    while ((fMatch = fieldRegex.exec(rawBlock)) !== null) {
      const key = fMatch[1].toLowerCase().trim();
      const val = (fMatch[2] ?? fMatch[3] ?? fMatch[4] ?? '')
        .replace(/[{}]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      fields[key] = val;
    }

    let sourceType: SourceType = 'journal';
    if (rawType.includes('book') || rawType === 'incollection') {
      sourceType = 'book';
    } else if (rawType.includes('thesis')) {
      sourceType = 'thesis';
    } else if (rawType.includes('proc') || rawType === 'conference') {
      sourceType = 'conference';
    } else if (rawType === 'misc' || rawType === 'online' || rawType === 'electronic' || rawType === 'webpage') {
      sourceType = fields.journal ? 'journal' : 'website';
    }

    const title = fields.title || '';
    const combinedText = `${title} ${fields.author || ''} ${fields.publisher || ''} ${fields.journal || ''}`;
    const isThai = isThaiText(combinedText);
    const yearStr = fields.year || '';
    const yearNum = parseInt(yearStr, 10);
    const yearType: 'BE' | 'CE' = !isNaN(yearNum) && yearNum > 2400 ? 'BE' : isThai ? 'BE' : 'CE';

    const entry: BibliographyEntry = {
      id: makeId(),
      sourceType,
      language: isThai ? 'th' : 'en',
      title,
      authors: fields.author ? parseAuthorList(fields.author) : [],
      year: yearStr,
      yearType,
      containerTitle: fields.journal || fields.booktitle || fields.HowPublished || '',
      volume: fields.volume || '',
      issue: fields.number || fields.issue || '',
      pages: (fields.pages || '').replace(/--/g, '-'),
      publisher: fields.publisher || fields.organization || '',
      place: fields.address || fields.location || '',
      edition: fields.edition || '',
      institution: fields.school || fields.institution || '',
      degreeType:
        rawType === 'phdthesis'
          ? isThai
            ? 'วิทยานิพนธ์ปริญญาดุษฎีบัณฑิต'
            : 'Doctoral dissertation'
          : rawType === 'mastersthesis'
          ? isThai
            ? 'วิทยานิพนธ์ปริญญามหาบัณฑิต'
            : "Master's thesis"
          : fields.type || '',
      doi: fields.doi || '',
      isbn: fields.isbn || '',
      url: fields.url || '',
      accessDate: fields.urldate || fields.note || '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    results.push({
      entry,
      rawText: rawBlock,
      sourceFormat: 'bibtex',
    });
  };

  if (blocks.length > 0) {
    blocks.forEach(processBlock);
  } else {
    while ((match = entryRegex.exec(content)) !== null) {
      processBlock(match[0]);
    }
  }

  return results;
}

/**
 * 2. Parse RIS (.ris)
 */
export function parseRisContent(content: string): ParsedExternalEntry[] {
  const results: ParsedExternalEntry[] = [];
  const rawRecords = content
    .split(/\nER\s*-\s*.*(?:\n|$)/i)
    .map((r) => r.trim())
    .filter((r) => /TY\s*-/i.test(r));

  for (const record of rawRecords) {
    const lines = record.split(/\r?\n/);
    let ty = 'JOUR';
    let title = '';
    const authorLines: string[] = [];
    let year = '';
    let containerTitle = '';
    let volume = '';
    let issue = '';
    let sp = '';
    let ep = '';
    let publisher = '';
    let place = '';
    let doi = '';
    let isbn = '';
    let url = '';
    let accessDate = '';
    let institution = '';

    for (const line of lines) {
      const m = line.match(/^([A-Z0-9]{2})\s*-\s*(.*)$/);
      if (!m) continue;
      const tag = m[1].toUpperCase();
      const val = m[2].trim();
      if (!val) continue;

      switch (tag) {
        case 'TY':
          ty = val.toUpperCase();
          break;
        case 'TI':
        case 'T1':
          if (!title) title = val;
          break;
        case 'AU':
        case 'A1':
          authorLines.push(val);
          break;
        case 'PY':
        case 'Y1':
        case 'DA': {
          const ym = val.match(/\b(\d{4})\b/);
          if (ym && !year) year = ym[1];
          break;
        }
        case 'JO':
        case 'JF':
        case 'T2':
        case 'BT':
          if (!containerTitle) containerTitle = val;
          break;
        case 'VL':
          volume = val;
          break;
        case 'IS':
          issue = val;
          break;
        case 'SP':
          sp = val;
          break;
        case 'EP':
          ep = val;
          break;
        case 'PB':
          if (!publisher) publisher = val;
          break;
        case 'CY':
        case 'PP':
          if (!place) place = val;
          break;
        case 'DO':
          doi = val;
          break;
        case 'SN':
          isbn = val;
          break;
        case 'UR':
        case 'L2':
          if (!url) url = val;
          break;
        case 'Y2':
          accessDate = val;
          break;
        case 'AD':
        case 'IN':
          if (!institution) institution = val;
          break;
      }
    }

    let sourceType: SourceType = 'journal';
    if (ty.includes('BOOK') || ty === 'CHAP') sourceType = 'book';
    else if (ty.includes('THES')) sourceType = 'thesis';
    else if (ty.includes('CONF') || ty === 'CPAPER') sourceType = 'conference';
    else if (ty.includes('ELEC') || ty === 'WEB' || ty === 'BLOG') sourceType = 'website';

    const combined = `${title} ${authorLines.join(' ')} ${publisher} ${containerTitle}`;
    const isThai = isThaiText(combined);
    const yearNum = parseInt(year, 10);
    const yearType: 'BE' | 'CE' = !isNaN(yearNum) && yearNum > 2400 ? 'BE' : isThai ? 'BE' : 'CE';
    const pages = sp && ep ? `${sp}-${ep}` : sp || ep || '';

    const entry: BibliographyEntry = {
      id: makeId(),
      sourceType,
      language: isThai ? 'th' : 'en',
      title,
      authors: parseAuthorList(authorLines),
      year,
      yearType,
      containerTitle,
      volume,
      issue,
      pages,
      publisher,
      place,
      institution: sourceType === 'thesis' ? institution || publisher : institution,
      doi,
      isbn,
      url,
      accessDate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    results.push({
      entry,
      rawText: record + '\nER  -',
      sourceFormat: 'ris',
    });
  }

  return results;
}

/**
 * 3. Parse JSON (CSL-JSON or AutoBiblio JSON)
 */
export function parseJsonContent(content: string): ParsedExternalEntry[] {
  const parsed = JSON.parse(content);
  const rawList: any[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.entries)
    ? parsed.entries
    : Array.isArray(parsed.items)
    ? parsed.items
    : [parsed];

  const results: ParsedExternalEntry[] = [];

  for (const item of rawList) {
    if (!item || typeof item !== 'object') continue;

    // Check if already AutoBiblio format
    if (item.sourceType && Array.isArray(item.authors) && item.authors[0]?.firstName !== undefined) {
      const isThai = item.language === 'th' || isThaiText(item.title || '');
      results.push({
        entry: {
          id: makeId(),
          sourceType: item.sourceType || 'book',
          language: item.language || (isThai ? 'th' : 'en'),
          title: item.title || '',
          authors: item.authors || [],
          year: item.year || '',
          yearType: item.yearType || (isThai ? 'BE' : 'CE'),
          containerTitle: item.containerTitle || '',
          volume: item.volume || '',
          issue: item.issue || '',
          pages: item.pages || '',
          publisher: item.publisher || '',
          place: item.place || '',
          edition: item.edition || '',
          institution: item.institution || '',
          degreeType: item.degreeType || '',
          doi: item.doi || '',
          isbn: item.isbn || '',
          url: item.url || '',
          accessDate: item.accessDate || '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        rawText: JSON.stringify(item, null, 2),
        sourceFormat: 'json',
      });
      continue;
    }

    // Otherwise CSL-JSON or generic JSON
    const cslType = String(item.type || item.sourceType || '').toLowerCase();
    let sourceType: SourceType = 'book';
    if (cslType.includes('article') || cslType.includes('journal') || item.journal || item['container-title']) {
      sourceType = 'journal';
    } else if (cslType.includes('thesis')) {
      sourceType = 'thesis';
    } else if (cslType.includes('web') || cslType.includes('post')) {
      sourceType = 'website';
    } else if (cslType.includes('conf') || cslType.includes('paper')) {
      sourceType = 'conference';
    }

    const title = item.title || item.name || '';
    let authors: Author[] = [];
    if (Array.isArray(item.author)) {
      authors = item.author.map((a: any) => {
        const given = a.given || a.firstName || a.literal || '';
        const family = a.family || a.lastName || '';
        const combined = `${given} ${family}`;
        return {
          id: makeAuthorId(),
          firstName: given || family,
          lastName: given ? family : '',
          isOrganization: !!a.literal && !a.family,
          isThai: isThaiText(combined),
        };
      });
    } else if (typeof item.author === 'string') {
      authors = parseAuthorList(item.author);
    } else if (typeof item.authors === 'string') {
      authors = parseAuthorList(item.authors);
    }

    const issuedYear =
      item.year ||
      item.issued?.['date-parts']?.[0]?.[0] ||
      item.published?.['date-parts']?.[0]?.[0] ||
      '';
    const yearStr = String(issuedYear || '');
    const isThai = isThaiText(`${title} ${item.publisher || ''}`);
    const yearNum = parseInt(yearStr, 10);

    results.push({
      entry: {
        id: makeId(),
        sourceType,
        language: isThai ? 'th' : 'en',
        title,
        authors,
        year: yearStr,
        yearType: !isNaN(yearNum) && yearNum > 2400 ? 'BE' : isThai ? 'BE' : 'CE',
        containerTitle: item['container-title'] || item.containerTitle || item.journal || '',
        volume: String(item.volume || ''),
        issue: String(item.issue || item.number || ''),
        pages: String(item.page || item.pages || ''),
        publisher: item.publisher || '',
        place: item['publisher-place'] || item.place || item.address || '',
        institution: item.institution || item.school || '',
        degreeType: item.genre || item.degreeType || '',
        doi: item.DOI || item.doi || '',
        isbn: item.ISBN || item.isbn || '',
        url: item.URL || item.url || '',
        accessDate: item.accessed?.raw || item.accessDate || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      rawText: JSON.stringify(item, null, 2),
      sourceFormat: 'json',
    });
  }

  return results;
}

/**
 * Helper to split a CSV row respecting quotes
 */
function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * 4. Parse CSV / TSV (.csv, .tsv)
 */
export function parseCsvContent(content: string): ParsedExternalEntry[] {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const firstRow = splitCsvLine(lines[0], delimiter);

  const headerMap: Record<string, number> = {};
  const isHeaderRow = firstRow.some((cell) =>
    /^(title|author|authors|year|journal|publisher|source|type|doi|url|ชื่อเรื่อง|ผู้แต่ง|ปี|สำนักพิมพ์|วารสาร)/i.test(
      cell.trim()
    )
  );

  if (isHeaderRow) {
    firstRow.forEach((col, idx) => {
      const c = col.toLowerCase().trim();
      if (c.includes('title') || c.includes('ชื่อเรื่อง') || c.includes('เรื่อง')) headerMap.title = idx;
      else if (c.includes('author') || c.includes('ผู้แต่ง') || c.includes('ผู้เขียน')) headerMap.authors = idx;
      else if (c.includes('year') || c.includes('ปี')) headerMap.year = idx;
      else if (c.includes('journal') || c.includes('container') || c.includes('วารสาร') || c.includes('เว็บไซต์'))
        headerMap.containerTitle = idx;
      else if (c.includes('publisher') || c.includes('สำนักพิมพ์')) headerMap.publisher = idx;
      else if (c.includes('place') || c.includes('city') || c.includes('สถานที่') || c.includes('จังหวัด'))
        headerMap.place = idx;
      else if (c.includes('vol') || c.includes('ปีที่')) headerMap.volume = idx;
      else if (c.includes('issue') || c.includes('number') || c.includes('ฉบับ')) headerMap.issue = idx;
      else if (c.includes('page') || c.includes('หน้า')) headerMap.pages = idx;
      else if (c.includes('doi')) headerMap.doi = idx;
      else if (c.includes('isbn')) headerMap.isbn = idx;
      else if (c.includes('url') || c.includes('link') || c.includes('ลิงก์')) headerMap.url = idx;
      else if (c.includes('type') || c.includes('ประเภท')) headerMap.sourceType = idx;
      else if (c.includes('institution') || c.includes('มหาวิทยาลัย') || c.includes('สถาบัน'))
        headerMap.institution = idx;
    });
  }

  const dataLines = isHeaderRow ? lines.slice(1) : lines;
  const results: ParsedExternalEntry[] = [];

  for (const rawLine of dataLines) {
    const cols = splitCsvLine(rawLine, delimiter);
    if (cols.every((c) => !c)) continue;

    const getVal = (key: string, fallbackIdx?: number) => {
      if (headerMap[key] !== undefined) return cols[headerMap[key]] || '';
      if (!isHeaderRow && fallbackIdx !== undefined) return cols[fallbackIdx] || '';
      return '';
    };

    const title = getVal('title', 0);
    const authorRaw = getVal('authors', 1);
    const year = getVal('year', 2);
    const publisher = getVal('publisher', 3);
    const place = getVal('place', 4);
    const containerTitle = getVal('containerTitle');
    const volume = getVal('volume');
    const issue = getVal('issue');
    const pages = getVal('pages');
    const doi = getVal('doi');
    const isbn = getVal('isbn');
    const url = getVal('url');
    const institution = getVal('institution');
    const rawType = getVal('sourceType').toLowerCase();

    let sourceType: SourceType = 'book';
    if (rawType.includes('journal') || rawType.includes('วารสาร') || containerTitle || volume) {
      sourceType = 'journal';
    } else if (rawType.includes('thesis') || rawType.includes('วิทยานิพนธ์') || institution) {
      sourceType = 'thesis';
    } else if (rawType.includes('web') || rawType.includes('เว็บ') || (url && !publisher && !containerTitle)) {
      sourceType = 'website';
    }

    const isThai = isThaiText(`${title} ${authorRaw} ${publisher} ${containerTitle}`);
    const yearNum = parseInt(year, 10);

    results.push({
      entry: {
        id: makeId(),
        sourceType,
        language: isThai ? 'th' : 'en',
        title,
        authors: authorRaw ? parseAuthorList(authorRaw) : [],
        year,
        yearType: !isNaN(yearNum) && yearNum > 2400 ? 'BE' : isThai ? 'BE' : 'CE',
        containerTitle,
        volume,
        issue,
        pages,
        publisher,
        place,
        institution,
        doi,
        isbn,
        url,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      rawText: rawLine,
      sourceFormat: 'csv',
    });
  }

  return results;
}

/**
 * 5. Parse Plain-Text / Word Paragraph Citations (.txt, .md, .docx)
 * Smartly parses formatted Thai & English bibliography lines (APA, MLA, Vancouver, Chicago, or draft lines)
 */
export function parsePlainTextCitationLine(
  rawLine: string,
  formatLabel: 'txt' | 'docx' = 'txt'
): ParsedExternalEntry | null {
  const cleaned = rawLine
    .replace(/^(\[\d+\]|\d+[.)]|[-•*])\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Ignore section headers like "บรรณานุกรม", "References", "Bibliography"
  if (
    !cleaned ||
    cleaned.length < 8 ||
    /^(บรรณานุกรม|เอกสารอ้างอิง|รายการอ้างอิง|references|bibliography|works cited)$/i.test(cleaned)
  ) {
    return null;
  }

  const isThai = isThaiText(cleaned);

  // Extract URL and DOI if present
  const urlMatch = cleaned.match(/https?:\/\/[^\s)>]+/i);
  const url = urlMatch ? urlMatch[0].replace(/[.,;]+$/, '') : '';
  const doiMatch = cleaned.match(/\b(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)\b/i);
  const doi = doiMatch ? doiMatch[1].replace(/[.,;]+$/, '') : '';
  const isbnMatch = cleaned.match(/ISBN[:\s-]*([0-9X-]{10,17})/i);
  const isbn = isbnMatch ? isbnMatch[1].trim() : '';

  // Extract Access Date if present
  let accessDate = '';
  const thaiAccessMatch = cleaned.match(
    /(?:สืบค้นเมื่อ|เข้าถึงเมื่อ|สืบค้นวันที่)\s*([^,.;]+?)(?=\s*(?:จาก|https?:|$))/i
  );
  const enAccessMatch = cleaned.match(/Retrieved\s+([^,]+,\s*\d{4})\s*,?\s*from/i);
  if (thaiAccessMatch) accessDate = thaiAccessMatch[1].trim();
  else if (enAccessMatch) accessDate = enAccessMatch[1].trim();

  // Strip URL/DOI tail for cleaner structural parsing
  const textWithoutUrl = cleaned
    .replace(/(?:สืบค้นเมื่อ|เข้าถึงเมื่อ).*$/i, '')
    .replace(/Retrieved\s+.*$/i, '')
    .replace(/https?:\/\/[^\s]+/gi, '')
    .replace(/doi:\s*10\.[^\s]+/gi, '')
    .trim();

  // Try matching standard Year in parentheses: Author. (Year). Rest...
  const yearParenMatch = textWithoutUrl.match(
    /^(.*?)\s*\(\s*(\d{4}|ม\.ป\.ป\.|n\.d\.)\s*\)\.?\s*(.*)$/i
  );

  let authorSegment = '';
  let year = '';
  let restSegment = textWithoutUrl;

  if (yearParenMatch) {
    authorSegment = yearParenMatch[1].replace(/\.$/, '').trim();
    year = yearParenMatch[2].trim();
    restSegment = yearParenMatch[3].trim();
  } else {
    // Try matching year anywhere e.g. MLA/Chicago/Vancouver: Author. Title. Publisher, 2022.
    const sentences = textWithoutUrl
      .split(/\.\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const anyYearMatch = textWithoutUrl.match(/\b(25\d{2}|24\d{2}|20\d{2}|19\d{2}|ม\.ป\.ป\.|n\.d\.)\b/i);
    if (anyYearMatch) {
      year = anyYearMatch[1];
    }

    if (sentences.length >= 2) {
      // Check if first segment looks like an author name
      const firstSeg = sentences[0];
      if (firstSeg.length < 75 && !/^(การ|การศึกษา|การพัฒนา|รายงาน|โครงการ|แนวทาง|คู่มือ)/.test(firstSeg)) {
        authorSegment = firstSeg;
        restSegment = sentences.slice(1).join('. ');
      }
    }
  }

  const authors = authorSegment ? parseAuthorList(authorSegment) : [];

  // Now parse restSegment into Title, Journal/Publisher/Place/Thesis
  let sourceType: SourceType = 'book';
  let title = '';
  let containerTitle = '';
  let volume = '';
  let issue = '';
  let pages = '';
  let publisher = '';
  let place = '';
  let institution = '';
  let degreeType = '';

  // Check if Thesis
  if (/วิทยานิพนธ์|ดุษฎีนิพนธ์|สารนิพนธ์|ค้นคว้าอิสระ|dissertation|master's thesis|doctoral/i.test(restSegment)) {
    sourceType = 'thesis';
    const parts = restSegment
      .split(/\.\s+/)
      .map((p) => p.trim())
      .filter(Boolean);
    title = parts[0]?.replace(/\[.*?\]/g, '').trim() || restSegment;
    for (const p of parts.slice(1)) {
      if (/วิทยานิพนธ์|ดุษฎีนิพนธ์|สารนิพนธ์|dissertation|thesis/i.test(p)) {
        degreeType = p.replace(/[[\]()]/g, '').trim();
      } else if (/มหาวิทยาลัย|สถาบัน|university|institute|college/i.test(p)) {
        institution = p.replace(/\.$/, '').trim();
      }
    }
    if (!institution) {
      const uniMatch = restSegment.match(/((?:มหาวิทยาลัย|สถาบัน)[^\s.,;)]+)/);
      if (uniMatch) institution = uniMatch[1];
    }
  }
  // Check if Journal Article (e.g. Title. Journal Name, 12(2), 45-60 or ปีที่ 12 ฉบับที่ 2 หน้า 45-60)
  else if (
    /\b\d+\s*\(\s*\d+\s*\)\s*,\s*\d+/.test(restSegment) ||
    /วารสาร|journal|transactions|review|proceedings|ปีที่\s*\d+|ฉบับที่\s*\d+/i.test(restSegment)
  ) {
    sourceType = 'journal';
    const parts = restSegment
      .split(/\.\s+/)
      .map((p) => p.trim())
      .filter(Boolean);
    title = parts[0] || restSegment;
    const journalTail = parts.slice(1).join('. ');

    // Match pattern: Journal Name, 15(2), 10-25
    const jMatch = journalTail.match(/^([^,]+?),\s*(\d+)\s*(?:\(\s*([^)]+)\s*\))?\s*(?:,\s*(?:หน้า|pp?\.)?\s*([\d–-]+))?/);
    if (jMatch) {
      containerTitle = jMatch[1].trim();
      volume = jMatch[2].trim();
      issue = (jMatch[3] || '').trim();
      pages = (jMatch[4] || '').replace(/–/g, '-').trim();
    } else {
      // Check Thai format: วารสาร..., ปีที่ 10 ฉบับที่ 2, หน้า 15-30
      const volThai = journalTail.match(/ปีที่\s*(\d+)/);
      const issThai = journalTail.match(/ฉบับที่\s*(\d+)/);
      const pageThai = journalTail.match(/(?:หน้า|pp?\.)\s*([\d–-]+)/i) || journalTail.match(/,\s*(\d+\s*[-–]\s*\d+)/);
      if (volThai) volume = volThai[1];
      if (issThai) issue = issThai[1];
      if (pageThai) pages = pageThai[1].replace(/\s+/g, '').replace(/–/g, '-');
      containerTitle = journalTail
        .replace(/,?\s*ปีที่\s*\d+.*$/i, '')
        .replace(/,?\s*ฉบับที่\s*\d+.*$/i, '')
        .replace(/,?\s*(?:หน้า|pp?\.)\s*[\d–-]+.*$/i, '')
        .replace(/\.$/, '')
        .trim();
    }
  }
  // Check if Website
  else if (url && !/สำนักพิมพ์|โรงพิมพ์|press|publishing/i.test(restSegment)) {
    sourceType = 'website';
    const parts = restSegment
      .split(/\.\s+/)
      .map((p) => p.trim())
      .filter(Boolean);
    title = parts[0] || restSegment;
    if (parts.length > 1) {
      containerTitle = parts.slice(1).join('. ').replace(/\.$/, '').trim();
    }
  }
  // Otherwise Book
  else {
    sourceType = 'book';
    const parts = restSegment
      .split(/\.\s+/)
      .map((p) => p.trim())
      .filter(Boolean);
    title = (parts[0] || restSegment).replace(/\.$/, '').trim();
    if (parts.length > 1) {
      const pubSegment = parts
        .slice(1)
        .join('. ')
        .replace(/\b(25\d{2}|20\d{2}|19\d{2})\b\.?/g, '')
        .replace(/\.$/, '')
        .trim();

      if (pubSegment.includes(':')) {
        const [pl, pub] = pubSegment.split(':').map((s) => s.trim());
        place = pl;
        publisher = pub;
      } else {
        publisher = pubSegment;
      }
    }
  }

  const yearNum = parseInt(year, 10);
  const yearType: 'BE' | 'CE' = !isNaN(yearNum) && yearNum > 2400 ? 'BE' : isThai ? 'BE' : 'CE';

  return {
    entry: {
      id: makeId(),
      sourceType,
      language: isThai ? 'th' : 'en',
      title: title.replace(/\.$/, '').trim(),
      authors,
      year,
      yearType,
      containerTitle,
      volume,
      issue,
      pages,
      publisher,
      place,
      institution,
      degreeType,
      doi,
      isbn,
      url,
      accessDate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    rawText: cleaned,
    sourceFormat: formatLabel,
  };
}

/**
 * Extract paragraphs from a .docx Word file (ZIP archive containing word/document.xml)
 * Uses native Web DecompressionStream('deflate-raw')
 */
export async function extractParagraphsFromDocx(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  // Locate local file header for "word/document.xml"
  let offset = 0;
  const decoder = new TextDecoder('utf-8');

  while (offset + 30 < bytes.length) {
    const sig = view.getUint32(offset, true);
    if (sig !== 0x04034b50) {
      offset++;
      continue;
    }

    const compressionMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const fileNameLength = view.getUint16(offset + 26, true);
    const extraFieldLength = view.getUint16(offset + 28, true);

    const nameBytes = bytes.subarray(offset + 30, offset + 30 + fileNameLength);
    const entryName = decoder.decode(nameBytes);
    const dataStart = offset + 30 + fileNameLength + extraFieldLength;

    if (entryName === 'word/document.xml') {
      // Find end of compressed data (either compressedSize or next PK header if data descriptor used)
      let actualEnd = dataStart + compressedSize;
      if (compressedSize === 0 || actualEnd > bytes.length) {
        actualEnd = bytes.length;
        for (let scan = dataStart; scan + 4 < bytes.length; scan++) {
          if (
            bytes[scan] === 0x50 &&
            bytes[scan + 1] === 0x4b &&
            (bytes[scan + 2] === 0x03 || bytes[scan + 2] === 0x01 || bytes[scan + 2] === 0x07)
          ) {
            actualEnd = scan;
            break;
          }
        }
      }

      const slice = bytes.subarray(dataStart, actualEnd);
      let xmlText = '';

      if (compressionMethod === 0) {
        xmlText = decoder.decode(slice);
      } else if (compressionMethod === 8 && typeof DecompressionStream !== 'undefined') {
        const ds = new DecompressionStream('deflate-raw');
        const writer = ds.writable.getWriter();
        writer.write(slice).catch(() => {});
        writer.close().catch(() => {});

        const reader = ds.readable.getReader();
        const chunks: Uint8Array[] = [];
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) chunks.push(value);
          }
        } catch {
          // Ignore trailing stream errors when data descriptor is present
        }
        const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
        const merged = new Uint8Array(totalLen);
        let pos = 0;
        for (const c of chunks) {
          merged.set(c, pos);
          pos += c.length;
        }
        xmlText = decoder.decode(merged);
      }

      if (xmlText) {
        const paragraphs: string[] = [];
        const pMatches = xmlText.match(/<w:p[\s>][\s\S]*?<\/w:p>/g) || [];
        for (const pXml of pMatches) {
          const tMatches = pXml.match(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g) || [];
          const line = tMatches
            .map((t) =>
              t
                .replace(/<[^>]+>/g, '')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&apos;/g, "'")
            )
            .join('')
            .trim();
          if (line) paragraphs.push(line);
        }
        return paragraphs;
      }
      break;
    }

    offset = dataStart + (compressedSize > 0 ? compressedSize : 1);
  }

  return [];
}

/**
 * Main Entry Point: Parse any uploaded external bibliography file
 */
export async function parseExternalBibliographyFile(file: File): Promise<ExternalFileParseResult> {
  const fileName = file.name;
  const lowerName = fileName.toLowerCase();
  const warnings: string[] = [];

  if (lowerName.endsWith('.docx')) {
    try {
      const paragraphs = await extractParagraphsFromDocx(file);
      const entries = paragraphs
        .map((line) => parsePlainTextCitationLine(line, 'docx'))
        .filter((item): item is ParsedExternalEntry => item !== null);

      if (entries.length === 0) {
        warnings.push('ไม่พบรายการบรรณานุกรมในไฟล์ Word (.docx) หรือไฟล์อาจมีเฉพาะหัวข้อ');
      }
      return {
        fileName,
        detectedFormat: 'docx',
        entries,
        warnings,
      };
    } catch (e: any) {
      warnings.push(`เกิดข้อผิดพลาดในการอ่านไฟล์ .docx: ${e?.message || 'Unknown error'}`);
      return {
        fileName,
        detectedFormat: 'docx',
        entries: [],
        warnings,
      };
    }
  }

  const textContent = await file.text();
  return parseExternalBibliographyText(textContent, fileName);
}

/**
 * Parse raw text content with automatic format detection
 */
export function parseExternalBibliographyText(
  textContent: string,
  fileName: string = 'pasted-bibliography.txt'
): ExternalFileParseResult {
  const trimmed = textContent.trim();
  const lowerName = fileName.toLowerCase();
  const warnings: string[] = [];

  if (!trimmed) {
    return {
      fileName,
      detectedFormat: 'txt',
      entries: [],
      warnings: ['ไฟล์ไม่มีข้อมูล'],
    };
  }

  // 1. Check BibTeX
  if (lowerName.endsWith('.bib') || /^@\w+\s*\{/m.test(trimmed)) {
    const entries = parseBibTeXContent(trimmed);
    return {
      fileName,
      detectedFormat: 'bibtex',
      entries,
      warnings,
    };
  }

  // 2. Check RIS
  if (lowerName.endsWith('.ris') || (/^TY\s*-\s*/m.test(trimmed) && /^ER\s*-/m.test(trimmed))) {
    const entries = parseRisContent(trimmed);
    return {
      fileName,
      detectedFormat: 'ris',
      entries,
      warnings,
    };
  }

  // 3. Check JSON
  if (
    lowerName.endsWith('.json') ||
    ((trimmed.startsWith('[') || trimmed.startsWith('{')) &&
      (trimmed.endsWith('}') || trimmed.endsWith(']')))
  ) {
    try {
      const entries = parseJsonContent(trimmed);
      if (entries.length > 0) {
        return {
          fileName,
          detectedFormat: 'json',
          entries,
          warnings,
        };
      }
    } catch {
      // Fall through to plain text if invalid JSON
    }
  }

  // 4. Check CSV / TSV
  if (lowerName.endsWith('.csv') || lowerName.endsWith('.tsv')) {
    const entries = parseCsvContent(trimmed);
    return {
      fileName,
      detectedFormat: 'csv',
      entries,
      warnings,
    };
  }

  // 5. Default: Plain Text / Markdown lines (.txt, .md)
  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const entries = lines
    .map((line) => parsePlainTextCitationLine(line, 'txt'))
    .filter((item): item is ParsedExternalEntry => item !== null);

  return {
    fileName,
    detectedFormat: 'txt',
    entries,
    warnings,
  };
}

/**
 * Sample external file contents for 1-click testing
 */
export const SAMPLE_EXTERNAL_FILES: Record<
  'txt_mixed' | 'bibtex_sample' | 'ris_sample' | 'csv_sample',
  { fileName: string; label: string; description: string; content: string }
> = {
  txt_mixed: {
    fileName: 'draft-thesis-references.txt',
    label: 'ไฟล์ข้อความบรรณานุกรม (.txt) — มีทั้งข้อมูลครบและข้อมูลขาดหาย',
    description: 'จำลองไฟล์บรรณานุกรมจากวิทยานิพนธ์ที่มีบางรายการลืมใส่ปีพิมพ์ สำนักพิมพ์ และเลขหน้า',
    content: [
      'สมชาย ใจดี. (2566). การประยุกต์ใช้ปัญญาประดิษฐ์เพื่อการวิจัยทางการศึกษายุคดิจิทัล. กรุงเทพฯ: สำนักพิมพ์แห่งจุฬาลงกรณ์มหาวิทยาลัย.',
      'กานดา วงศ์สวัสดิ์. (). การพัฒนารูปแบบการเรียนการสอนออนไลน์สำหรับนักศึกษาระดับอุดมศึกษา.',
      'Vaswani, A., Shazeer, N., & Parmar, N. (2017). Attention is all you need. Advances in Neural Information Processing Systems.',
      'วิชัย พัฒนาการ. (2565). ปัจจัยที่ส่งผลต่อการยอมรับเทคโนโลยีคลาวด์ในองค์กรภาครัฐ. [วิทยานิพนธ์ปริญญามหาบัณฑิต].',
      'สำนักงานพัฒนาวิทยาศาสตร์และเทคโนโลยีแห่งชาติ. (). แนวทางการพัฒนาจริยธรรมปัญญาประดิษฐ์แห่งประเทศไทย. https://www.nstda.or.th/ai-ethics-guideline',
    ].join('\n'),
  },
  bibtex_sample: {
    fileName: 'scholar-export-references.bib',
    label: 'ไฟล์ BibTeX (.bib) จาก Google Scholar / IEEE (มีฟิลด์ขาดหาย)',
    description: 'จำลองไฟล์ .bib ที่ส่งออกจากฐานข้อมูลวิชาการแต่ขาดเลขหน้า ปีที่พิมพ์ หรือสำนักพิมพ์',
    content: `@article{lecun2015deep,
  title={Deep learning},
  author={LeCun, Yann and Bengio, Yoshua and Hinton, Geoffrey},
  journal={Nature},
  volume={521},
  number={7553},
  pages={436--444},
  year={2015},
  doi={10.1038/nature14539}
}

@book{kahneman2011thinking,
  title={Thinking, fast and slow},
  author={Kahneman, Daniel},
  year={}
}

@article{thai2024ai,
  title={การวิเคราะห์ข้อมูลขนาดใหญ่เพื่อการบริหารการศึกษาไทย},
  author={ประเสริฐ ศรีสุวรรณ},
  journal={วารสารวิจัยทางการศึกษา},
  year={2567}
}`,
  },
  ris_sample: {
    fileName: 'scopus-citations.ris',
    label: 'ไฟล์ RIS (.ris) จาก Scopus / EndNote / ThaiJO',
    description: 'จำลองไฟล์มาตรฐาน .ris สำหรับตรวจสอบความสมบูรณ์ของฟิลด์ข้อมูล',
    content: `TY  - JOUR
TI  - Language Models are Few-Shot Learners
AU  - Brown, Tom B.
AU  - Mann, Benjamin
JO  - Advances in Neural Information Processing Systems
VL  - 33
SP  - 1877
EP  - 1901
PY  - 2020
ER  -

TY  - BOOK
TI  - ระเบียบวิธีวิจัยทางสังคมศาสตร์ยุคใหม่
AU  - สุรชัย พงศ์พิพัฒน์
CY  - กรุงเทพฯ
ER  -`,
  },
  csv_sample: {
    fileName: 'bibliography-table.csv',
    label: 'ไฟล์ตาราง Excel / CSV (.csv)',
    description: 'จำลองไฟล์ตารางรายการบรรณานุกรมที่ส่งออกจาก Excel หรือ Google Sheets',
    content: `ชื่อเรื่อง,ผู้แต่ง,ปีที่พิมพ์,วารสาร,สำนักพิมพ์,สถานที่พิมพ์,ประเภท
การบริหารจัดการนวัตกรรมดิจิทัลในสถานศึกษา,ดร.นภัสสร วัฒนากุล,2566,,สำนักพิมพ์แห่งมหาวิทยาลัยธรรมศาสตร์,กรุงเทพฯ,book
ปัญญาประดิษฐ์กับการเรียนรู้ตลอดชีวิต,ผศ.ดร.ธนากร เจริญสุข,,วารสารเทคโนโลยีและสื่อสารการศึกษา,,,journal
Generative AI in Higher Education,Smith, John,2024,Journal of Educational Technology,,,journal`,
  },
};
