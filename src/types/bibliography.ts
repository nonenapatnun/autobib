export type CitationStyle =
  | 'apa7'
  | 'apa6'
  | 'mla9'
  | 'chicago'
  | 'harvard'
  | 'vancouver';

export type SourceType =
  | 'book'
  | 'journal'
  | 'chapter'
  | 'website'
  | 'thesis'
  | 'conference'
  | 'newspaper';

export type LanguageType = 'th' | 'en';

export interface Author {
  id: string;
  firstName: string; // ชื่อ หรือ Initial
  lastName: string;  // นามสกุล (สำหรับต่างประเทศ) หรือปล่อยว่างถ้าเป็นชื่อ-นามสกุลไทยใน firstName
  middleName?: string;
  isOrganization?: boolean; // นิติบุคคล / องค์กร เช่น สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน
  isThai?: boolean;
}

export interface BibliographyEntry {
  id: string;
  sourceType: SourceType;
  language: LanguageType;
  title: string;
  authors: Author[];
  year: string; // e.g., "2023" หรือ "2566"
  yearType?: 'CE' | 'BE'; // ค.ศ. หรือ พ.ศ.
  monthDay?: string; // สำหรับเว็บไซต์หรือหนังสือพิมพ์ e.g. "15 ตุลาคม" หรือ "October 15"
  
  // Publication details
  containerTitle?: string; // ชื่อวารสาร, ชื่อหนังสือรวมบทความ, ชื่อเว็บไซต์
  volume?: string;        // ปีที่ (Volume)
  issue?: string;         // ฉบับที่ (Issue)
  pages?: string;         // เลขหน้า เช่น 45-62
  edition?: string;       // พิมพ์ครั้งที่ เช่น 2, 3rd ed.
  publisher?: string;     // สำนักพิมพ์
  place?: string;         // สถานที่พิมพ์ (เมือง, ประเทศ/รัฐ) - จำเป็นสำหรับ APA 6, Chicago, Harvard, Vancouver
  
  // Identifiers & Links
  doi?: string;           // เช่น 10.1016/j.jbusres.2021.03.001
  isbn?: string;          // เช่น 9786160840502
  url?: string;           // URL เว็บไซต์
  accessDate?: string;    // วันที่สืบค้น เช่น 1 พฤศจิกายน 2569
  
  // Extra specific fields
  institution?: string;   // มหาวิทยาลัย/สถาบัน สำหรับวิทยานิพนธ์
  degreeType?: string;    // วิทยานิพนธ์ปริญญาดุษฎีนิพนธ์ / มหาบัณฑิต / Doctoral dissertation
  conferenceName?: string;// ชื่อการประชุมวิชาการ
  editors?: Author[];     // บรรณาธิการ (สำหรับ chapter)
  citationNumber?: number; // ลำดับอ้างอิงสำหรับระบบตัวเลข (Vancouver [1], [2])
  
  createdAt: number;
  updatedAt: number;
}

export interface FormattedSpan {
  text: string;
  italic?: boolean;
  bold?: boolean;
  underline?: boolean;
  isUrl?: boolean;
}

export interface FormattedCitation {
  id: string;
  style: CitationStyle;
  spans: FormattedSpan[];
  plainText: string;
  htmlText: string;
  inTextParenthetical: string; // เช่น (สมชาย ใจดี, 2566) หรือ [1]
  inTextNarrative: string;     // เช่น สมชาย ใจดี (2566) หรือ [1]
  sortKey: string;             // คีย์สำหรับเรียงลำดับ ก-ฮ / A-Z หรือ ตัวเลข
  citationNumber?: number;
}

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  id: string;
  field: keyof BibliographyEntry | 'authors';
  severity: ValidationSeverity;
  message: string;
  suggestion: string;
  quickFixValue?: string;
}

export interface EntryValidationResult {
  entryId: string;
  entryTitle: string;
  style: CitationStyle;
  isValid: boolean;
  issues: ValidationIssue[];
}
