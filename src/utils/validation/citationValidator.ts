import {
  BibliographyEntry,
  CitationStyle,
  EntryValidationResult,
  ValidationIssue
} from '../../types/bibliography';

const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

const EN_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function getFormattedTodayAccessDate(isThai: boolean): string {
  const now = new Date();
  const day = now.getDate();
  const monthIdx = now.getMonth();
  const yearCE = now.getFullYear();
  if (isThai) {
    return `${day} ${THAI_MONTHS[monthIdx]} ${yearCE + 543}`;
  }
  return `${day} ${EN_MONTHS[monthIdx]} ${yearCE}`;
}

function inferSiteNameFromUrl(url?: string, isThai?: boolean): string {
  if (url && url.trim()) {
    try {
      const parsed = new URL(url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`);
      const host = parsed.hostname.replace(/^www\./i, '');
      if (host) return host;
    } catch {
      // ignore invalid URL
    }
  }
  return isThai ? 'เว็บไซต์หน่วยงาน/ฐานข้อมูลออนไลน์' : 'Official Website';
}

function inferDoiOrUrlFix(entry: BibliographyEntry): { field: 'doi' | 'url'; value: string } {
  if (entry.url) {
    const doiMatch = entry.url.match(/(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i);
    if (doiMatch && doiMatch[1]) {
      return { field: 'doi', value: doiMatch[1] };
    }
  }
  const cleanTitle = (entry.title || '').trim();
  const fallbackUrl = entry.doi
    ? `https://doi.org/${entry.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim()}`
    : `https://scholar.google.com/scholar?q=${encodeURIComponent(cleanTitle || 'research')}`;
  return { field: 'url', value: fallbackUrl };
}

/**
 * Validates a single bibliography entry against the selected citation style.
 */
export function validateEntry(
  entry: BibliographyEntry,
  style: CitationStyle
): EntryValidationResult {
  const issues: ValidationIssue[] = [];
  const isThai = entry.language === 'th';

  // 1. Title Validation (All styles - Critical)
  if (!entry.title || !entry.title.trim()) {
    issues.push({
      id: `${entry.id}-title-missing`,
      field: 'title',
      severity: 'error',
      message: 'ไม่มีชื่อเรื่อง (Title missing)',
      suggestion: 'คลิกแก้ไขอัตโนมัติเพื่อใส่ชื่อเรื่องมาตรฐาน หรือดึงข้อมูลจากฐานข้อมูลวิชาการ',
      quickFixValue: entry.containerTitle?.trim() || (isThai ? 'เอกสารวิชาการ (ไม่ปรากฏชื่อเรื่อง)' : 'Untitled Academic Document')
    });
  }

  // 2. Authors Validation
  if (!entry.authors || entry.authors.length === 0 || entry.authors.every((a) => !a.firstName.trim() && !a.lastName.trim())) {
    const inferredOrg =
      entry.institution?.trim() ||
      entry.publisher?.trim() ||
      entry.containerTitle?.trim() ||
      (isThai ? 'คณะผู้วิจัย / หน่วยงานเจ้าของผลงาน' : 'Corporate Author / Institutional Author');
    issues.push({
      id: `${entry.id}-author-missing`,
      field: 'authors',
      severity: 'warning',
      message: 'ไม่ระบุชื่อผู้แต่ง (Author missing)',
      suggestion: isThai
        ? `คลิกแก้ไขอัตโนมัติเพื่อใช้ชื่อหน่วยงาน/ผู้แต่ง "${inferredOrg}" หรือดึงชื่อผู้แต่งจริงจากฐานข้อมูล`
        : `Click Auto-Fix to set author as "${inferredOrg}" or fetch real authors from academic database.`,
      quickFixValue: inferredOrg
    });
  } else {
    // Check if any author has empty name
    const invalidAuthor = entry.authors.some(
      (a) => !a.isOrganization && !a.firstName.trim() && !a.lastName.trim()
    );
    if (invalidAuthor) {
      issues.push({
        id: `${entry.id}-author-incomplete`,
        field: 'authors',
        severity: 'warning',
        message: 'มีรายการผู้แต่งที่ไม่ได้กรอกชื่อ',
        suggestion: 'คลิกแก้ไขอัตโนมัติเพื่อล้างช่องผู้แต่งที่ว่างออกโดยไม่ต้องพิมพ์เอง',
        quickFixValue: '__CLEAN_EMPTY_AUTHORS__'
      });
    }
  }

  // 3. Year Validation
  if (!entry.year || !entry.year.trim()) {
    issues.push({
      id: `${entry.id}-year-missing`,
      field: 'year',
      severity: 'warning',
      message: 'ไม่ระบุปีที่พิมพ์ (Year missing)',
      suggestion: isThai
        ? 'หากไม่ปรากฏปีที่พิมพ์ ระบบสามารถเติม "ม.ป.ป." (ไม่มีปีที่พิมพ์) ตามหลักเกณฑ์บรรณานุกรมให้ทันที'
        : 'If publication year is unknown, click Auto-Fix to insert standard "n.d." (no date).',
      quickFixValue: isThai ? 'ม.ป.ป.' : 'n.d.'
    });
  } else {
    const cleanYear = entry.year.trim();
    const isSpecialNoDate = cleanYear.toLowerCase() === 'n.d.' || cleanYear === 'ม.ป.ป.';
    if (!isSpecialNoDate) {
      const yearNum = parseInt(cleanYear, 10);
      if (isNaN(yearNum)) {
        issues.push({
          id: `${entry.id}-year-format`,
          field: 'year',
          severity: 'warning',
          message: 'รูปแบบปีที่พิมพ์ไม่ถูกต้อง',
          suggestion: 'ควรเป็นตัวเลข 4 หลัก เช่น 2566 หรือ 2023 (คลิกแก้ไขอัตโนมัติเพื่อเปลี่ยนเป็น ม.ป.ป. / n.d.)',
          quickFixValue: isThai ? 'ม.ป.ป.' : 'n.d.'
        });
      } else if (yearNum > 2600 || (yearNum > 2035 && yearNum < 2400)) {
        const correctedYear = isThai
          ? String(new Date().getFullYear() + 543)
          : String(new Date().getFullYear());
        issues.push({
          id: `${entry.id}-year-range`,
          field: 'year',
          severity: 'info',
          message: 'ปีที่พิมพ์อาจคลาดเคลื่อนจากเกณฑ์ พ.ศ./ค.ศ.',
          suggestion: `คลิกแก้ไขอัตโนมัติเพื่อปรับเป็นปีมาตรฐาน (${correctedYear})`,
          quickFixValue: correctedYear
        });
      }
    }
  }

  // 4. Source Type Specific Checks
  switch (entry.sourceType) {
    case 'book': {
      // Publisher
      if (!entry.publisher || !entry.publisher.trim()) {
        issues.push({
          id: `${entry.id}-publisher-missing`,
          field: 'publisher',
          severity: 'warning',
          message: 'ไม่ระบุชื่อสำนักพิมพ์ (Publisher missing)',
          suggestion: isThai
            ? 'คลิกแก้ไขอัตโนมัติเพื่อระบุ "ม.ป.ท." (ไม่ปรากฏสำนักพิมพ์) ตามเกณฑ์บรรณานุกรม หรือดึงจากฐานข้อมูล'
            : 'Click Auto-Fix to insert standard "n.p." (no publisher) or fetch from academic database.',
          quickFixValue: entry.institution?.trim() || (isThai ? 'ม.ป.ท.' : 'n.p.')
        });
      }

      // Place of Publication (Critical difference for APA 6, Chicago, Harvard, Vancouver)
      if (['apa6', 'chicago', 'harvard', 'vancouver'].includes(style)) {
        if (!entry.place || !entry.place.trim()) {
          const styleLabel =
            style === 'apa6'
              ? 'APA 6th'
              : style === 'chicago'
              ? 'Chicago 17th'
              : style === 'harvard'
              ? 'Harvard'
              : 'Vancouver';
          issues.push({
            id: `${entry.id}-place-missing`,
            field: 'place',
            severity: 'warning',
            message: `มาตรฐาน ${styleLabel} กำหนดให้ระบุสถานที่พิมพ์ (Place of publication)`,
            suggestion: isThai
              ? 'คลิกแก้ไขอัตโนมัติเพื่อใส่ "ม.ป.ท." (ไม่ปรากฏสถานที่พิมพ์) ตามมาตรฐานวิชาการ'
              : 'Click Auto-Fix to insert standard "n.p." (no place of publication).',
            quickFixValue: isThai ? 'ม.ป.ท.' : 'n.p.'
          });
        }
      }
      break;
    }

    case 'journal': {
      // Container Title (Journal Name)
      if (!entry.containerTitle || !entry.containerTitle.trim()) {
        issues.push({
          id: `${entry.id}-journal-missing`,
          field: 'containerTitle',
          severity: 'error',
          message: 'ไม่ระบุชื่อวารสาร (Journal title missing)',
          suggestion: 'คลิกดึงข้อมูลอัตโนมัติจากฐานข้อมูลวิชาการ หรือเติมชื่อวารสารมาตรฐาน',
          quickFixValue: entry.publisher?.trim() || (isThai ? 'วารสารวิชาการและงานวิจัย' : 'Journal of Academic Research')
        });
      }

      // Volume
      if (!entry.volume || !entry.volume.trim()) {
        issues.push({
          id: `${entry.id}-volume-missing`,
          field: 'volume',
          severity: 'warning',
          message: 'ไม่ระบุปีที่ของวารสาร (Volume missing)',
          suggestion: 'คลิกแก้ไขอัตโนมัติเพื่อดึงเลขปีที่ (Volume) หรือตั้งค่าเริ่มต้นเป็นปีที่ 1',
          quickFixValue: '1'
        });
      }

      // Pages
      if (!entry.pages || !entry.pages.trim()) {
        issues.push({
          id: `${entry.id}-pages-missing`,
          field: 'pages',
          severity: 'warning',
          message: 'ไม่ระบุเลขหน้า (Page range missing)',
          suggestion: 'คลิกแก้ไขอัตโนมัติเพื่อดึงเลขหน้าจากฐานข้อมูลวารสาร หรือใส่ช่วงหน้ามาตรฐาน (1-15)',
          quickFixValue: '1-15'
        });
      }

      // Issue recommendation
      if (!entry.issue || !entry.issue.trim()) {
        if (style === 'mla9' || style === 'apa7') {
          issues.push({
            id: `${entry.id}-issue-info`,
            field: 'issue',
            severity: 'info',
            message: 'หากวารสารมีเลขฉบับที่ (Issue / Number) ควรระบุให้ครบถ้วน',
            suggestion: 'คลิกแก้ไขอัตโนมัติเพื่อระบุฉบับที่ 1 (หรือดึงจากฐานข้อมูล CrossRef)',
            quickFixValue: '1'
          });
        }
      }

      // DOI / URL recommendation
      if (!entry.doi && !entry.url) {
        const inferred = inferDoiOrUrlFix(entry);
        issues.push({
          id: `${entry.id}-doi-info`,
          field: inferred.field,
          severity: 'info',
          message: 'ควรระบุ DOI หรือลิงก์ฐานข้อมูลของบทความวิจัย เพื่อความน่าเชื่อถือในการสืบค้น',
          suggestion: 'คลิกแก้ไขอัตโนมัติเพื่อแนบลิงก์สืบค้น Google Scholar / DOI ของบทความนี้โดยไม่ต้องพิมพ์เอง',
          quickFixValue: inferred.value
        });
      }
      break;
    }

    case 'chapter': {
      if (!entry.containerTitle || !entry.containerTitle.trim()) {
        issues.push({
          id: `${entry.id}-booktitle-missing`,
          field: 'containerTitle',
          severity: 'error',
          message: 'ไม่ระบุชื่อหนังสือรวมเรื่อง (Book container title missing)',
          suggestion: 'คลิกแก้ไขอัตโนมัติเพื่อเติมชื่อเอกสารรวมบทความมาตรฐาน',
          quickFixValue: entry.publisher?.trim() || (isThai ? 'ประมวลบทความวิชาการ' : 'Collected Academic Chapters')
        });
      }
      if (!entry.pages || !entry.pages.trim()) {
        issues.push({
          id: `${entry.id}-chapter-pages-missing`,
          field: 'pages',
          severity: 'warning',
          message: 'ไม่ระบุเลขหน้าบทความในหนังสือ (Pages missing)',
          suggestion: 'คลิกแก้ไขอัตโนมัติเพื่อระบุช่วงเลขหน้ามาตรฐาน (1-20)',
          quickFixValue: '1-20'
        });
      }
      if (!entry.publisher || !entry.publisher.trim()) {
        issues.push({
          id: `${entry.id}-chapter-publisher-missing`,
          field: 'publisher',
          severity: 'warning',
          message: 'ไม่ระบุสำนักพิมพ์ของหนังสือรวมบทความ',
          suggestion: isThai
            ? 'คลิกแก้ไขอัตโนมัติเพื่อระบุ "ม.ป.ท." (ไม่ปรากฏสำนักพิมพ์)'
            : 'Click Auto-Fix to insert standard "n.p." (no publisher).',
          quickFixValue: entry.institution?.trim() || (isThai ? 'ม.ป.ท.' : 'n.p.')
        });
      }
      break;
    }

    case 'website': {
      if (!entry.url || !entry.url.trim()) {
        const inferredUrl = entry.doi
          ? `https://doi.org/${entry.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim()}`
          : `https://scholar.google.com/scholar?q=${encodeURIComponent((entry.title || '').trim())}`;
        issues.push({
          id: `${entry.id}-url-missing`,
          field: 'url',
          severity: 'error',
          message: 'ไม่ระบุ URL เว็บไซต์ (Website URL missing)',
          suggestion: 'คลิกแก้ไขอัตโนมัติเพื่อสร้างลิงก์อ้างอิงไปยังแหล่งข้อมูลออนไลน์โดยไม่ต้องพิมพ์ URL เอง',
          quickFixValue: inferredUrl
        });
      }

      // Access date for MLA, Vancouver, and Harvard
      if (['mla9', 'vancouver', 'harvard'].includes(style)) {
        if (!entry.accessDate || !entry.accessDate.trim()) {
          const todayFormatted = getFormattedTodayAccessDate(isThai);
          issues.push({
            id: `${entry.id}-accessdate-missing`,
            field: 'accessDate',
            severity: 'warning',
            message: `มาตรฐาน ${style.toUpperCase()} กำหนดให้ระบุวันที่เข้าถึง (Access date)`,
            suggestion: isThai
              ? `คลิกแก้ไขอัตโนมัติเพื่อใส่วันที่สืบค้นปัจจุบัน (${todayFormatted})`
              : `Click Auto-Fix to insert current access date (${todayFormatted}).`,
            quickFixValue: todayFormatted
          });
        }
      }

      if (!entry.containerTitle || !entry.containerTitle.trim()) {
        const inferredSite = entry.publisher?.trim() || inferSiteNameFromUrl(entry.url, isThai);
        issues.push({
          id: `${entry.id}-sitename-info`,
          field: 'containerTitle',
          severity: 'info',
          message: 'ควรระบุชื่อเว็บไซต์หรือหน่วยงานเจ้าของเว็บไซต์ (Website / Portal Name)',
          suggestion: `คลิกแก้ไขอัตโนมัติเพื่อดึงชื่อเว็บไซต์ (${inferredSite}) จากลิงก์อัตโนมัติ`,
          quickFixValue: inferredSite
        });
      }
      break;
    }

    case 'thesis': {
      if (!entry.institution && !entry.publisher) {
        issues.push({
          id: `${entry.id}-institution-missing`,
          field: 'institution',
          severity: 'error',
          message: 'ไม่ระบุสถาบัน/มหาวิทยาลัย (Institution missing)',
          suggestion: 'คลิกดึงข้อมูลจริงจากฐานข้อมูลวิทยานิพนธ์ หรือเติมชื่อสถาบันมาตรฐาน',
          quickFixValue: isThai ? 'บัณฑิตวิทยาลัย มหาวิทยาลัยของรัฐ' : 'Graduate School, University'
        });
      }
      if (!entry.degreeType || !entry.degreeType.trim()) {
        issues.push({
          id: `${entry.id}-degree-info`,
          field: 'degreeType',
          severity: 'info',
          message: 'ควรระบุระดับปริญญาของวิทยานิพนธ์',
          suggestion: isThai
            ? 'คลิกแก้ไขอัตโนมัติเพื่อระบุ "วิทยานิพนธ์ปริญญามหาบัณฑิต"'
            : 'Click Auto-Fix to insert "Master\'s thesis".',
          quickFixValue: isThai ? 'วิทยานิพนธ์ปริญญามหาบัณฑิต' : "Master's thesis"
        });
      }
      break;
    }
  }

  // Has errors if any issue has severity 'error'
  const hasErrors = issues.some((i) => i.severity === 'error');

  return {
    entryId: entry.id,
    entryTitle: entry.title || 'ไม่มีชื่อเรื่อง',
    style,
    isValid: !hasErrors,
    issues
  };
}

/**
 * Validates all entries in the bibliography and returns an overall report.
 */
export function validateBibliography(
  entries: BibliographyEntry[],
  style: CitationStyle
): {
  totalEntries: number;
  validEntriesCount: number;
  entriesWithIssuesCount: number;
  totalErrors: number;
  totalWarnings: number;
  totalInfos: number;
  results: EntryValidationResult[];
} {
  const results = entries.map((e) => validateEntry(e, style));

  let totalErrors = 0;
  let totalWarnings = 0;
  let totalInfos = 0;
  let entriesWithIssuesCount = 0;

  for (const r of results) {
    if (r.issues.length > 0) {
      entriesWithIssuesCount++;
    }
    for (const issue of r.issues) {
      if (issue.severity === 'error') totalErrors++;
      if (issue.severity === 'warning') totalWarnings++;
      if (issue.severity === 'info') totalInfos++;
    }
  }

  return {
    totalEntries: entries.length,
    validEntriesCount: entries.length - results.filter((r) => !r.isValid).length,
    entriesWithIssuesCount,
    totalErrors,
    totalWarnings,
    totalInfos,
    results
  };
}
