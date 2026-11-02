import React, { useState, useMemo } from 'react';
import {
  X,
  BookOpen,
  FileText,
  Globe,
  GraduationCap,
  BookMarked,
  Users,
  Newspaper,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Sparkles,
  Eye,
  Edit3,
  Layers,
  Search,
  ArrowRightLeft,
  Info,
} from 'lucide-react';
import {
  BibliographyEntry,
  CitationStyle,
  SourceType,
} from '../types/bibliography';
import { formatCitation } from '../utils/formatters';
import { useLanguage } from '../contexts/LanguageContext';

const CITATION_STYLE_LABELS: Record<CitationStyle, { name: string }> = {
  apa7: { name: 'APA 7th' },
  apa6: { name: 'APA 6th' },
  mla9: { name: 'MLA 9th' },
  chicago: { name: 'Chicago 17th' },
  harvard: { name: 'Harvard' },
  vancouver: { name: 'Vancouver' },
};

const SOURCE_TYPE_LABELS: Record<SourceType, { th: string; en: string }> = {
  book: { th: 'หนังสือ / ตำรา', en: 'Book' },
  journal: { th: 'บทความวารสาร', en: 'Journal Article' },
  website: { th: 'เว็บไซต์ / ออนไลน์', en: 'Website' },
  thesis: { th: 'วิทยานิพนธ์', en: 'Thesis / Dissertation' },
  chapter: { th: 'บทในหนังสือ', en: 'Book Chapter' },
  conference: { th: 'รายงานประชุมวิชาการ', en: 'Conference Paper' },
  newspaper: { th: 'หนังสือพิมพ์ / นิตยสาร', en: 'Newspaper / Magazine' },
};

interface CitationCheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStyle: CitationStyle;
  onChangeStyle: (style: CitationStyle) => void;
  entries: BibliographyEntry[];
  onEditEntry?: (entry: BibliographyEntry) => void;
}

type TokenRole =
  | 'author'
  | 'year'
  | 'title'
  | 'container'
  | 'edition'
  | 'volume'
  | 'pages'
  | 'publisher'
  | 'locator';

interface FormulaToken {
  role: TokenRole;
  labelTh: string;
  labelEn: string;
  sampleEn: string;
  sampleTh: string;
  italic?: boolean;
  bold?: boolean;
  quotes?: boolean;
  punctuationAfter?: string;
}

interface CheatSheetItem {
  sourceType: SourceType;
  style: CitationStyle;
  formulaNoteTh: string;
  formulaNoteEn: string;
  tokens: FormulaToken[];
  inTextParentheticalEn: string;
  inTextNarrativeEn: string;
  inTextParentheticalTh: string;
  inTextNarrativeTh: string;
  verificationTipsTh: string[];
  verificationTipsEn: string[];
}

const TOKEN_ROLE_STYLES: Record<
  TokenRole,
  {
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    nameTh: string;
    nameEn: string;
  }
> = {
  author: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-900',
    badgeBg: 'bg-indigo-600 text-white',
    nameTh: 'ผู้แต่ง (Author)',
    nameEn: 'Author',
  },
  year: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-900',
    badgeBg: 'bg-amber-600 text-white',
    nameTh: 'ปีพิมพ์ (Year)',
    nameEn: 'Year / Date',
  },
  title: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-900',
    badgeBg: 'bg-emerald-600 text-white',
    nameTh: 'ชื่อเรื่อง (Title)',
    nameEn: 'Work Title',
  },
  container: {
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    text: 'text-violet-900',
    badgeBg: 'bg-violet-600 text-white',
    nameTh: 'ชื่อวารสาร/แหล่งที่มา (Container)',
    nameEn: 'Journal / Container',
  },
  edition: {
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    text: 'text-cyan-900',
    badgeBg: 'bg-cyan-600 text-white',
    nameTh: 'ครั้งที่พิมพ์/ประเภท (Edition/Type)',
    nameEn: 'Edition / Type',
  },
  volume: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-900',
    badgeBg: 'bg-rose-600 text-white',
    nameTh: 'ปีที่/ฉบับที่ (Vol/Issue)',
    nameEn: 'Volume / Issue',
  },
  pages: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-900',
    badgeBg: 'bg-orange-600 text-white',
    nameTh: 'เลขหน้า (Pages)',
    nameEn: 'Page Range',
  },
  publisher: {
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    text: 'text-teal-900',
    badgeBg: 'bg-teal-600 text-white',
    nameTh: 'สำนักพิมพ์/สถาบัน (Publisher)',
    nameEn: 'Publisher / Institution',
  },
  locator: {
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    text: 'text-sky-900',
    badgeBg: 'bg-sky-600 text-white',
    nameTh: 'DOI / URL',
    nameEn: 'DOI / URL',
  },
};

const SOURCE_ICONS: Record<SourceType, React.ReactNode> = {
  book: <BookOpen className="w-4 h-4" />,
  journal: <FileText className="w-4 h-4" />,
  website: <Globe className="w-4 h-4" />,
  thesis: <GraduationCap className="w-4 h-4" />,
  chapter: <BookMarked className="w-4 h-4" />,
  conference: <Users className="w-4 h-4" />,
  newspaper: <Newspaper className="w-4 h-4" />,
};

const STYLE_BADGE_COLORS: Record<CitationStyle, string> = {
  apa7: 'bg-indigo-600 text-white border-indigo-600',
  apa6: 'bg-amber-600 text-white border-amber-600',
  mla9: 'bg-rose-600 text-white border-rose-600',
  chicago: 'bg-teal-600 text-white border-teal-600',
  harvard: 'bg-emerald-600 text-white border-emerald-600',
  vancouver: 'bg-purple-600 text-white border-purple-600',
};

function buildCheatSheetItem(style: CitationStyle, sourceType: SourceType): CheatSheetItem {
  // Helper to generate accurate, style-specific visual cheat sheets for all 6 styles x 7 source types
  if (sourceType === 'book') {
    switch (style) {
      case 'apa7':
        return {
          sourceType,
          style,
          formulaNoteTh: 'APA 7th ตัดเมืองที่พิมพ์ออกแล้ว ชื่อหนังสือใช้ตัวเอียง (Sentence case) และแสดง DOI เป็นลิงก์ https://doi.org/...',
          formulaNoteEn: 'APA 7th omits publisher city. Book title is italicized in sentence case, followed by Publisher and DOI URL.',
          tokens: [
            { role: 'author', labelTh: 'ผู้แต่ง', labelEn: 'Author(s)', sampleEn: 'Creswell, J. W., & Creswell, J. D.', sampleTh: 'ชาย โพธิสิตา.', punctuationAfter: ' ' },
            { role: 'year', labelTh: '(ปีพิมพ์).', labelEn: '(Year).', sampleEn: '(2023).', sampleTh: '(2564).', punctuationAfter: ' ' },
            { role: 'title', labelTh: 'ชื่อหนังสือ', labelEn: 'Book title', sampleEn: 'Research design: Qualitative, quantitative, and mixed methods approaches', sampleTh: 'ศาสตร์และศิลป์แห่งการวิจัยเชิงคุณภาพ', italic: true, punctuationAfter: ' ' },
            { role: 'edition', labelTh: '(ครั้งที่พิมพ์).', labelEn: '(Edition).', sampleEn: '(6th ed.).', sampleTh: '(พิมพ์ครั้งที่ 9).', punctuationAfter: ' ' },
            { role: 'publisher', labelTh: 'สำนักพิมพ์.', labelEn: 'Publisher.', sampleEn: 'SAGE Publications.', sampleTh: 'สำนักพิมพ์แห่งจุฬาลงกรณ์มหาวิทยาลัย.', punctuationAfter: '' },
          ],
          inTextParentheticalEn: '(Creswell & Creswell, 2023)',
          inTextNarrativeEn: 'Creswell and Creswell (2023)',
          inTextParentheticalTh: '(ชาย โพธิสิตา, 2564)',
          inTextNarrativeTh: 'ชาย โพธิสิตา (2564)',
          verificationTipsTh: [
            'ชื่อหนังสือต้องเป็นตัวเอียง (Italics) และใช้อักษรตัวพิมพ์ใหญ่เฉพาะคำแรก (Sentence case)',
            'วงเล็บครั้งที่พิมพ์ เช่น (6th ed.) หรือ (พิมพ์ครั้งที่ 9) ต้องเป็นตัวตรงธรรมดา ไม่เอียง',
            'ไม่ต้องระบุเมืองที่พิมพ์ (เช่น ตัด New York, NY: หรือ กรุงเทพฯ: ออกใน APA 7th)',
          ],
          verificationTipsEn: [
            'Book title must be italicized in sentence case (only first word and proper nouns capitalized).',
            'Edition in parentheses (e.g., (6th ed.)) is NOT italicized and precedes the period.',
            'Do NOT include publisher location/city in APA 7th edition.',
          ],
        };
      case 'apa6':
        return {
          sourceType,
          style,
          formulaNoteTh: 'APA 6th ต้องระบุเมืองที่พิมพ์คั่นด้วยทวิภาค (เมืองที่พิมพ์: สำนักพิมพ์)',
          formulaNoteEn: 'APA 6th requires Publisher City/Location followed by a colon before the Publisher.',
          tokens: [
            { role: 'author', labelTh: 'ผู้แต่ง', labelEn: 'Author(s)', sampleEn: 'Creswell, J. W.', sampleTh: 'ชาย โพธิสิตา.', punctuationAfter: ' ' },
            { role: 'year', labelTh: '(ปีพิมพ์).', labelEn: '(Year).', sampleEn: '(2018).', sampleTh: '(2562).', punctuationAfter: ' ' },
            { role: 'title', labelTh: 'ชื่อหนังสือ', labelEn: 'Book title', sampleEn: 'Research design: Qualitative, quantitative, and mixed methods approaches', sampleTh: 'ศาสตร์และศิลป์แห่งการวิจัยเชิงคุณภาพ', italic: true, punctuationAfter: ' ' },
            { role: 'edition', labelTh: '(ครั้งที่พิมพ์).', labelEn: '(Edition).', sampleEn: '(5th ed.).', sampleTh: '(พิมพ์ครั้งที่ 8).', punctuationAfter: ' ' },
            { role: 'publisher', labelTh: 'เมืองที่พิมพ์: สำนักพิมพ์.', labelEn: 'Location: Publisher.', sampleEn: 'Thousand Oaks, CA: SAGE Publications.', sampleTh: 'กรุงเทพฯ: สำนักพิมพ์แห่งจุฬาลงกรณ์มหาวิทยาลัย.', punctuationAfter: '' },
          ],
          inTextParentheticalEn: '(Creswell, 2018)',
          inTextNarrativeEn: 'Creswell (2018)',
          inTextParentheticalTh: '(ชาย โพธิสิตา, 2562)',
          inTextNarrativeTh: 'ชาย โพธิสิตา (2562)',
          verificationTipsTh: [
            'ต้องมี "เมืองที่พิมพ์: สำนักพิมพ์." เสมอใน APA 6th',
            'ชื่อหนังสือใช้ตัวเอียง (Italics)',
          ],
          verificationTipsEn: [
            'Must include "Location: Publisher." in APA 6th.',
            'Book title is italicized in sentence case.',
          ],
        };
      case 'mla9':
        return {
          sourceType,
          style,
          formulaNoteTh: 'MLA 9th ใช้ชื่อเต็มของผู้แต่ง ชื่อหนังสือตัวเอียง และปีพิมพ์อยู่ท้ายสุดหลังสำนักพิมพ์',
          formulaNoteEn: 'MLA 9th spells out author first name, italicizes Title in Title Case, and puts Year at the end.',
          tokens: [
            { role: 'author', labelTh: 'นามสกุล, ชื่อ.', labelEn: 'Last, First.', sampleEn: 'Creswell, John W., and J. David Creswell.', sampleTh: 'ชาย โพธิสิตา.', punctuationAfter: ' ' },
            { role: 'title', labelTh: 'ชื่อหนังสือ.', labelEn: 'Title of Book.', sampleEn: 'Research Design: Qualitative, Quantitative, and Mixed Methods Approaches.', sampleTh: 'ศาสตร์และศิลป์แห่งการวิจัยเชิงคุณภาพ.', italic: true, punctuationAfter: ' ' },
            { role: 'edition', labelTh: 'ครั้งที่พิมพ์,', labelEn: 'Edition,', sampleEn: '6th ed.,', sampleTh: 'พิมพ์ครั้งที่ 9,', punctuationAfter: ' ' },
            { role: 'publisher', labelTh: 'สำนักพิมพ์,', labelEn: 'Publisher,', sampleEn: 'SAGE Publications,', sampleTh: 'สำนักพิมพ์แห่งจุฬาลงกรณ์มหาวิทยาลัย,', punctuationAfter: ' ' },
            { role: 'year', labelTh: 'ปีพิมพ์.', labelEn: 'Year.', sampleEn: '2023.', sampleTh: '2564.', punctuationAfter: '' },
          ],
          inTextParentheticalEn: '(Creswell and Creswell 45)',
          inTextNarrativeEn: 'Creswell and Creswell (45)',
          inTextParentheticalTh: '(ชาย โพธิสิตา 45)',
          inTextNarrativeTh: 'ชาย โพธิสิตา (45)',
          verificationTipsTh: [
            'ไม่มีวงเล็บครอบปีพิมพ์ และปีพิมพ์วางไว้ท้ายสุดหลังสำนักพิมพ์',
            'การอ้างอิงในเนื้อหา (In-text) ของ MLA ใช้ (ผู้แต่ง เลขหน้า) โดยไม่มีจุลภาคคั่น',
          ],
          verificationTipsEn: [
            'Full given name follows surname (Last, First). Year appears at the end after Publisher.',
            'MLA in-text citation uses (Author Page) without a comma or year.',
          ],
        };
      case 'chicago':
        return {
          sourceType,
          style,
          formulaNoteTh: 'Chicago 17th (Author-Date) ไม่ใส่วงเล็บครอบปีพิมพ์ และระบุเมืองที่พิมพ์: สำนักพิมพ์',
          formulaNoteEn: 'Chicago 17th Author-Date places Year after author without parentheses, and includes City: Publisher.',
          tokens: [
            { role: 'author', labelTh: 'ผู้แต่ง.', labelEn: 'Author.', sampleEn: 'Creswell, John W., and J. David Creswell.', sampleTh: 'ชาย โพธิสิตา.', punctuationAfter: ' ' },
            { role: 'year', labelTh: 'ปีพิมพ์.', labelEn: 'Year.', sampleEn: '2023.', sampleTh: '2564.', punctuationAfter: ' ' },
            { role: 'title', labelTh: 'ชื่อหนังสือ.', labelEn: 'Title of Book.', sampleEn: 'Research Design: Qualitative, Quantitative, and Mixed Methods Approaches.', sampleTh: 'ศาสตร์และศิลป์แห่งการวิจัยเชิงคุณภาพ.', italic: true, punctuationAfter: ' ' },
            { role: 'edition', labelTh: 'ครั้งที่พิมพ์.', labelEn: 'Edition.', sampleEn: '6th ed.', sampleTh: 'พิมพ์ครั้งที่ 9.', punctuationAfter: ' ' },
            { role: 'publisher', labelTh: 'เมือง: สำนักพิมพ์.', labelEn: 'City: Publisher.', sampleEn: 'Thousand Oaks, CA: SAGE Publications.', sampleTh: 'กรุงเทพฯ: สำนักพิมพ์แห่งจุฬาลงกรณ์มหาวิทยาลัย.', punctuationAfter: '' },
          ],
          inTextParentheticalEn: '(Creswell and Creswell 2023, 45)',
          inTextNarrativeEn: 'Creswell and Creswell (2023, 45)',
          inTextParentheticalTh: '(ชาย โพธิสิตา 2564, 45)',
          inTextNarrativeTh: 'ชาย โพธิสิตา (2564, 45)',
          verificationTipsTh: [
            'ปีพิมพ์ไม่มีวงเล็บครอบ และคั่นด้วยจุด (Author. Year. Title.)',
            'อ้างอิงในเนื้อหาไม่มีจุลภาคระหว่างชื่อผู้แต่งและปีพิมพ์ เช่น (Creswell 2023)',
          ],
          verificationTipsEn: [
            'Year is NOT enclosed in parentheses in the reference list (Author. Year. Title.).',
            'In-text citation omits comma between author and year: (Author Year, Page).',
          ],
        };
      case 'harvard':
        return {
          sourceType,
          style,
          formulaNoteTh: 'Harvard ใช้วงเล็บครอบปีพิมพ์ ไม่มีจุดหลังวงเล็บปีพิมพ์ในบางแบบ หรือคั่นด้วยจุดตามเกณฑ์มหาวิทยาลัย',
          formulaNoteEn: 'Harvard places (Year) after author, italicizes Book Title, and ends with City: Publisher.',
          tokens: [
            { role: 'author', labelTh: 'ผู้แต่ง', labelEn: 'Author', sampleEn: 'Creswell, J.W. and Creswell, J.D.', sampleTh: 'ชาย โพธิสิตา', punctuationAfter: ' ' },
            { role: 'year', labelTh: '(ปีพิมพ์)', labelEn: '(Year)', sampleEn: '(2023)', sampleTh: '(2564)', punctuationAfter: ' ' },
            { role: 'title', labelTh: 'ชื่อหนังสือ.', labelEn: 'Book title.', sampleEn: 'Research design: qualitative, quantitative, and mixed methods approaches.', sampleTh: 'ศาสตร์และศิลป์แห่งการวิจัยเชิงคุณภาพ.', italic: true, punctuationAfter: ' ' },
            { role: 'edition', labelTh: 'ครั้งที่พิมพ์.', labelEn: 'Edition.', sampleEn: '6th edn.', sampleTh: 'พิมพ์ครั้งที่ 9.', punctuationAfter: ' ' },
            { role: 'publisher', labelTh: 'เมือง: สำนักพิมพ์.', labelEn: 'City: Publisher.', sampleEn: 'Thousand Oaks, CA: SAGE Publications.', sampleTh: 'กรุงเทพฯ: สำนักพิมพ์แห่งจุฬาลงกรณ์มหาวิทยาลัย.', punctuationAfter: '' },
          ],
          inTextParentheticalEn: '(Creswell and Creswell, 2023)',
          inTextNarrativeEn: 'Creswell and Creswell (2023)',
          inTextParentheticalTh: '(ชาย โพธิสิตา, 2564)',
          inTextNarrativeTh: 'ชาย โพธิสิตา (2564)',
          verificationTipsTh: [
            'ชื่อย่อผู้แต่งภาษาอังกฤษเขียนติดกันโดยไม่เว้นวรรค เช่น J.W. และเชื่อมผู้แต่งสุดท้ายด้วย and',
            'ระบุครั้งที่พิมพ์เป็น edn. และตามด้วย เมือง: สำนักพิมพ์',
          ],
          verificationTipsEn: [
            'Author initials have no space between them (e.g., J.W.) and use "and" instead of "&".',
            'Includes edition (e.g., 6th edn.) and City: Publisher.',
          ],
        };
      case 'vancouver':
        return {
          sourceType,
          style,
          formulaNoteTh: 'Vancouver เรียงตามลำดับเลข [1] ชื่อย่อผู้แต่งไม่ใส่จุด ชื่อหนังสือตัวตรงธรรมดา (ไม่เอียง)',
          formulaNoteEn: 'Vancouver uses numbered references [1]. Author initials have no periods, and book titles are NOT italicized.',
          tokens: [
            { role: 'author', labelTh: '[1] ผู้แต่ง.', labelEn: '[1] Author(s).', sampleEn: '1. Creswell JW, Creswell JD.', sampleTh: '1. ชาย โพธิสิตา.', punctuationAfter: ' ' },
            { role: 'title', labelTh: 'ชื่อหนังสือ.', labelEn: 'Book title.', sampleEn: 'Research design: qualitative, quantitative, and mixed methods approaches.', sampleTh: 'ศาสตร์และศิลป์แห่งการวิจัยเชิงคุณภาพ.', italic: false, punctuationAfter: ' ' },
            { role: 'edition', labelTh: 'ครั้งที่พิมพ์.', labelEn: 'Edition.', sampleEn: '6th ed.', sampleTh: 'พิมพ์ครั้งที่ 9.', punctuationAfter: ' ' },
            { role: 'publisher', labelTh: 'เมือง: สำนักพิมพ์;', labelEn: 'City: Publisher;', sampleEn: 'Thousand Oaks (CA): SAGE Publications;', sampleTh: 'กรุงเทพฯ: สำนักพิมพ์แห่งจุฬาลงกรณ์มหาวิทยาลัย;', punctuationAfter: ' ' },
            { role: 'year', labelTh: 'ปีพิมพ์.', labelEn: 'Year.', sampleEn: '2023.', sampleTh: '2564.', punctuationAfter: '' },
          ],
          inTextParentheticalEn: '[1]',
          inTextNarrativeEn: 'Creswell and Creswell [1]',
          inTextParentheticalTh: '[1]',
          inTextNarrativeTh: 'ชาย โพธิสิตา [1]',
          verificationTipsTh: [
            'ห้ามทำตัวเอียงในชื่อหนังสือ (Vancouver ใช้ตัวตรงทั้งหมด)',
            'ชื่อย่อผู้แต่งภาษาอังกฤษไม่ใส่จุด เช่น Creswell JW',
            'คั่นสำนักพิมพ์กับปีพิมพ์ด้วยอัฒภาค (;) เช่น SAGE Publications; 2023.',
          ],
          verificationTipsEn: [
            'Do NOT italicize book titles in Vancouver style.',
            'Author initials have no periods or spaces (e.g., Creswell JW).',
            'Separate Publisher and Year with a semicolon (;).',
          ],
        };
    }
  }

  if (sourceType === 'journal') {
    switch (style) {
      case 'apa7':
        return {
          sourceType,
          style,
          formulaNoteTh: 'APA 7th ชื่อบทความตัวตรง ชื่อวารสารและเลขปีที่ (Volume) ตัวเอียง ส่วนฉบับที่ (Issue) อยู่ในวงเล็บตัวตรง',
          formulaNoteEn: 'APA 7th italicizes Journal Name and Volume number. Issue number in parentheses is NOT italicized.',
          tokens: [
            { role: 'author', labelTh: 'ผู้แต่ง', labelEn: 'Author(s)', sampleEn: 'Vaswani, A., Shazeer, N., & Polosukhin, I.', sampleTh: 'สมชาย ใจดี, และ สมหญิง รักเรียน.', punctuationAfter: ' ' },
            { role: 'year', labelTh: '(ปีพิมพ์).', labelEn: '(Year).', sampleEn: '(2023).', sampleTh: '(2566).', punctuationAfter: ' ' },
            { role: 'title', labelTh: 'ชื่อบทความ.', labelEn: 'Article title.', sampleEn: 'Attention mechanisms in modern neural architectures.', sampleTh: 'การพัฒนาระบบจัดการบรรณานุกรมอัตโนมัติสำหรับบัณฑิตศึกษา.', italic: false, punctuationAfter: ' ' },
            { role: 'container', labelTh: 'ชื่อวารสาร,', labelEn: 'Journal Title,', sampleEn: 'Journal of Artificial Intelligence Research,', sampleTh: 'วารสารวิจัยและพัฒนาการศึกษา,', italic: true, punctuationAfter: ' ' },
            { role: 'volume', labelTh: 'ปีที่(ฉบับที่),', labelEn: 'Volume(Issue),', sampleEn: '48(2),', sampleTh: '15(2),', italic: true, punctuationAfter: ' ' },
            { role: 'pages', labelTh: 'เลขหน้า.', labelEn: 'Pages.', sampleEn: '112–128.', sampleTh: '45–62.', punctuationAfter: ' ' },
            { role: 'locator', labelTh: 'DOI', labelEn: 'DOI URL', sampleEn: 'https://doi.org/10.1613/jair.1.14250', sampleTh: 'https://doi.org/10.14456/jred.2023.4', punctuationAfter: '' },
          ],
          inTextParentheticalEn: '(Vaswani et al., 2023)',
          inTextNarrativeEn: 'Vaswani et al. (2023)',
          inTextParentheticalTh: '(สมชาย ใจดี และ สมหญิง รักเรียน, 2566)',
          inTextNarrativeTh: 'สมชาย ใจดี และ สมหญิง รักเรียน (2566)',
          verificationTipsTh: [
            'ชื่อบทความใช้ตัวตรงธรรมดา ชื่อวารสารและเลขปีที่ (Volume) ใช้ตัวเอียง',
            'เลขฉบับที่อยู่ในวงเล็บติดกับปีที่ เช่น 15(2) โดยที่ (2) ไม่เป็นตัวเอียง และไม่ใส่คำว่า pp. หน้าเลขหน้า',
            'ผู้แต่ง 3 คนขึ้นไป อ้างอิงในเนื้อหาใช้ et al. หรือ และคณะ ตั้งแต่อ้างอิงครั้งแรก',
          ],
          verificationTipsEn: [
            'Article title is plain text (sentence case); Journal Title is italicized (Title Case).',
            'Volume number is italicized, followed immediately by (Issue) in plain text with NO space.',
            'Do NOT use "pp." before page numbers for journal articles in APA.',
          ],
        };
      case 'apa6':
        return {
          sourceType,
          style,
          formulaNoteTh: 'APA 6th โครงสร้างคล้าย APA 7th แต่ DOI สามารถใช้รูปแบบ doi:10.xxxx หรือ https://doi.org/ ได้',
          formulaNoteEn: 'APA 6th italicizes Journal Name and Volume. Uses doi:10.xxxx or Retrieved from URL.',
          tokens: [
            { role: 'author', labelTh: 'ผู้แต่ง', labelEn: 'Author(s)', sampleEn: 'Vaswani, A., & Shazeer, N.', sampleTh: 'สมชาย ใจดี.', punctuationAfter: ' ' },
            { role: 'year', labelTh: '(ปีพิมพ์).', labelEn: '(Year).', sampleEn: '(2019).', sampleTh: '(2562).', punctuationAfter: ' ' },
            { role: 'title', labelTh: 'ชื่อบทความ.', labelEn: 'Article title.', sampleEn: 'Attention mechanisms in neural architectures.', sampleTh: 'การพัฒนาระบบสารสนเทศเพื่อการวิจัย.', italic: false, punctuationAfter: ' ' },
            { role: 'container', labelTh: 'ชื่อวารสาร,', labelEn: 'Journal Title,', sampleEn: 'Journal of AI Research,', sampleTh: 'วารสารวิจัยการศึกษา,', italic: true, punctuationAfter: ' ' },
            { role: 'volume', labelTh: 'ปีที่(ฉบับที่),', labelEn: 'Volume(Issue),', sampleEn: '42(1),', sampleTh: '12(1),', italic: true, punctuationAfter: ' ' },
            { role: 'pages', labelTh: 'เลขหน้า.', labelEn: 'Pages.', sampleEn: '112–128.', sampleTh: '45–62.', punctuationAfter: ' ' },
            { role: 'locator', labelTh: 'doi:', labelEn: 'doi:', sampleEn: 'doi:10.1613/jair.1.112', sampleTh: 'doi:10.14456/jred.2019.1', punctuationAfter: '' },
          ],
          inTextParentheticalEn: '(Vaswani & Shazeer, 2019)',
          inTextNarrativeEn: 'Vaswani and Shazeer (2019)',
          inTextParentheticalTh: '(สมชาย ใจดี, 2562)',
          inTextNarrativeTh: 'สมชาย ใจดี (2562)',
          verificationTipsTh: [
            'ชื่อวารสารและเลขปีที่ (Volume) ต้องเป็นตัวเอียง',
            'ใน APA 6th หากผู้แต่ง 3-5 คน อ้างอิงครั้งแรกต้องใส่ชื่อทุกคน ครั้งต่อไปจึงใช้ et al.',
          ],
          verificationTipsEn: [
            'Journal title and Volume are italicized; Issue in parentheses is not.',
            'In APA 6th, 3–5 authors are all listed on first in-text citation, then shortened to et al.',
          ],
        };
      case 'mla9':
        return {
          sourceType,
          style,
          formulaNoteTh: 'MLA 9th ชื่อบทความอยู่ในเครื่องหมายคำพูด "..." ชื่อวารสารตัวเอียง และระบุ vol., no., ปี, pp.',
          formulaNoteEn: 'MLA 9th puts Article Title in quotation marks, italicizes Journal Title, and uses vol., no., Year, pp.',
          tokens: [
            { role: 'author', labelTh: 'ผู้แต่ง.', labelEn: 'Author.', sampleEn: 'Vaswani, Ashish, et al.', sampleTh: 'สมชาย ใจดี และ สมหญิง รักเรียน.', punctuationAfter: ' ' },
            { role: 'title', labelTh: '"ชื่อบทความ."', labelEn: '"Article Title."', sampleEn: '"Attention Mechanisms in Modern Neural Architectures."', sampleTh: '"การพัฒนาระบบจัดการบรรณานุกรมอัตโนมัติ."', quotes: true, punctuationAfter: ' ' },
            { role: 'container', labelTh: 'ชื่อวารสาร,', labelEn: 'Journal Title,', sampleEn: 'Journal of Artificial Intelligence Research,', sampleTh: 'วารสารวิจัยและพัฒนาการศึกษา,', italic: true, punctuationAfter: ' ' },
            { role: 'volume', labelTh: 'vol. X, no. Y,', labelEn: 'vol. X, no. Y,', sampleEn: 'vol. 48, no. 2,', sampleTh: 'ปีที่ 15, ฉบับที่ 2,', punctuationAfter: ' ' },
            { role: 'year', labelTh: 'ปีพิมพ์,', labelEn: 'Year,', sampleEn: '2023,', sampleTh: '2566,', punctuationAfter: ' ' },
            { role: 'pages', labelTh: 'pp. เลขหน้า.', labelEn: 'pp. Pages.', sampleEn: 'pp. 112–128.', sampleTh: 'หน้า 45–62.', punctuationAfter: ' ' },
            { role: 'locator', labelTh: 'DOI.', labelEn: 'DOI.', sampleEn: 'https://doi.org/10.1613/jair.1.14250.', sampleTh: 'https://doi.org/10.14456/jred.2023.4.', punctuationAfter: '' },
          ],
          inTextParentheticalEn: '(Vaswani et al. 115)',
          inTextNarrativeEn: 'Vaswani et al. (115)',
          inTextParentheticalTh: '(สมชาย ใจดี และ สมหญิง รักเรียน 48)',
          inTextNarrativeTh: 'สมชาย ใจดี และ สมหญิง รักเรียน (48)',
          verificationTipsTh: [
            'ชื่อบทความต้องอยู่ในเครื่องหมายอัญประกาศ ("...") และจุดอยู่ข้างในเครื่องหมายคำพูด',
            'ต้องใช้คำย่อ vol., no., และ pp. หน้าเลขหน้า',
          ],
          verificationTipsEn: [
            'Article title must be enclosed in double quotation marks ("...") in Title Case.',
            'Explicitly uses "vol.", "no.", and "pp." separated by commas.',
          ],
        };
      case 'chicago':
        return {
          sourceType,
          style,
          formulaNoteTh: 'Chicago 17th ชื่อบทความอยู่ในเครื่องหมายคำพูด "..." และคั่นปีที่/ฉบับที่กับเลขหน้าด้วยทวิภาค (:)',
          formulaNoteEn: 'Chicago 17th puts Article Title in quotes, italicizes Journal, and uses Volume, no. Issue: Pages.',
          tokens: [
            { role: 'author', labelTh: 'ผู้แต่ง.', labelEn: 'Author.', sampleEn: 'Vaswani, Ashish, and Noam Shazeer.', sampleTh: 'สมชาย ใจดี และ สมหญิง รักเรียน.', punctuationAfter: ' ' },
            { role: 'year', labelTh: 'ปีพิมพ์.', labelEn: 'Year.', sampleEn: '2023.', sampleTh: '2566.', punctuationAfter: ' ' },
            { role: 'title', labelTh: '"ชื่อบทความ."', labelEn: '"Article Title."', sampleEn: '"Attention Mechanisms in Modern Neural Architectures."', sampleTh: '"การพัฒนาระบบจัดการบรรณานุกรมอัตโนมัติ."', quotes: true, punctuationAfter: ' ' },
            { role: 'container', labelTh: 'ชื่อวารสาร', labelEn: 'Journal Title', sampleEn: 'Journal of Artificial Intelligence Research', sampleTh: 'วารสารวิจัยและพัฒนาการศึกษา', italic: true, punctuationAfter: ' ' },
            { role: 'volume', labelTh: 'ปีที่, no. ฉบับที่:', labelEn: 'Volume, no. Issue:', sampleEn: '48, no. 2:', sampleTh: '15, ฉบับที่ 2:', punctuationAfter: ' ' },
            { role: 'pages', labelTh: 'เลขหน้า.', labelEn: 'Pages.', sampleEn: '112–128.', sampleTh: '45–62.', punctuationAfter: ' ' },
            { role: 'locator', labelTh: 'DOI.', labelEn: 'DOI.', sampleEn: 'https://doi.org/10.1613/jair.1.14250.', sampleTh: 'https://doi.org/10.14456/jred.2023.4.', punctuationAfter: '' },
          ],
          inTextParentheticalEn: '(Vaswani and Shazeer 2023, 115)',
          inTextNarrativeEn: 'Vaswani and Shazeer (2023, 115)',
          inTextParentheticalTh: '(สมชาย ใจดี และ สมหญิง รักเรียน 2566, 48)',
          inTextNarrativeTh: 'สมชาย ใจดี และ สมหญิง รักเรียน (2566, 48)',
          verificationTipsTh: [
            'หลังชื่อวารสารไม่ต้องใส่จุลภาค ตามด้วยเลขปีที่ทันที เช่น Journal Title 48, no. 2: 112–128.',
            'ชื่อบทความอยู่ในเครื่องหมายคำพูด "..."',
          ],
          verificationTipsEn: [
            'No comma between italicized Journal Title and Volume number.',
            'Colon (:) precedes the page range.',
          ],
        };
      case 'harvard':
        return {
          sourceType,
          style,
          formulaNoteTh: 'Harvard ชื่อบทความอยู่ในเครื่องหมายอัญประกาศเดี่ยว/คู่ ชื่อวารสารตัวเอียง และระบุ pp. หน้าเลขหน้า',
          formulaNoteEn: 'Harvard puts Article Title in single/double quotes, italicizes Journal Title, and uses pp. before pages.',
          tokens: [
            { role: 'author', labelTh: 'ผู้แต่ง', labelEn: 'Author', sampleEn: 'Vaswani, A. and Shazeer, N.', sampleTh: 'สมชาย ใจดี และ สมหญิง รักเรียน', punctuationAfter: ' ' },
            { role: 'year', labelTh: '(ปีพิมพ์)', labelEn: '(Year)', sampleEn: '(2023)', sampleTh: '(2566)', punctuationAfter: ' ' },
            { role: 'title', labelTh: "'ชื่อบทความ',", labelEn: "'Article title',", sampleEn: "'Attention mechanisms in modern neural architectures',", sampleTh: "'การพัฒนาระบบจัดการบรรณานุกรมอัตโนมัติ',", punctuationAfter: ' ' },
            { role: 'container', labelTh: 'ชื่อวารสาร,', labelEn: 'Journal Title,', sampleEn: 'Journal of Artificial Intelligence Research,', sampleTh: 'วารสารวิจัยและพัฒนาการศึกษา,', italic: true, punctuationAfter: ' ' },
            { role: 'volume', labelTh: 'ปีที่(ฉบับที่),', labelEn: 'Volume(Issue),', sampleEn: '48(2),', sampleTh: '15(2),', punctuationAfter: ' ' },
            { role: 'pages', labelTh: 'pp. เลขหน้า.', labelEn: 'pp. Pages.', sampleEn: 'pp. 112–128.', sampleTh: 'หน้า 45–62.', punctuationAfter: '' },
          ],
          inTextParentheticalEn: '(Vaswani and Shazeer, 2023)',
          inTextNarrativeEn: 'Vaswani and Shazeer (2023)',
          inTextParentheticalTh: '(สมชาย ใจดี และ สมหญิง รักเรียน, 2566)',
          inTextNarrativeTh: 'สมชาย ใจดี และ สมหญิง รักเรียน (2566)',
          verificationTipsTh: [
            'ต้องระบุ pp. (หรือ หน้า) หน้าช่วงเลขหน้าของบทความวารสารเสมอในระบบ Harvard',
            'เลขปีที่ (Volume) ใน Harvard ไม่ต้องทำตัวเอียง (ต่างจาก APA ที่ทำตัวเอียง)',
          ],
          verificationTipsEn: [
            'Volume number is NOT italicized in Harvard style (unlike APA).',
            'Always include "pp." before the page range.',
          ],
        };
      case 'vancouver':
        return {
          sourceType,
          style,
          formulaNoteTh: 'Vancouver ใช้รูปแบบย่อ: ชื่อวารสาร. ปีพิมพ์;ปีที่(ฉบับที่):เลขหน้า. (ไม่มีเว้นวรรคหลังอัฒภาคและทวิภาค)',
          formulaNoteEn: 'Vancouver uses compact notation: Journal. Year;Volume(Issue):Pages. with NO italics.',
          tokens: [
            { role: 'author', labelTh: '[1] ผู้แต่ง.', labelEn: '[1] Author(s).', sampleEn: '1. Vaswani A, Shazeer N, Polosukhin I.', sampleTh: '1. สมชาย ใจดี, สมหญิง รักเรียน.', punctuationAfter: ' ' },
            { role: 'title', labelTh: 'ชื่อบทความ.', labelEn: 'Article title.', sampleEn: 'Attention mechanisms in modern neural architectures.', sampleTh: 'การพัฒนาระบบจัดการบรรณานุกรมอัตโนมัติสำหรับบัณฑิตศึกษา.', punctuationAfter: ' ' },
            { role: 'container', labelTh: 'ชื่อวารสาร.', labelEn: 'Journal Title.', sampleEn: 'J Artif Intell Res.', sampleTh: 'วารสารวิจัยและพัฒนาการศึกษา.', punctuationAfter: ' ' },
            { role: 'year', labelTh: 'ปี;', labelEn: 'Year;', sampleEn: '2023;', sampleTh: '2566;', punctuationAfter: '' },
            { role: 'volume', labelTh: 'ปีที่(ฉบับที่):', labelEn: 'Volume(Issue):', sampleEn: '48(2):', sampleTh: '15(2):', punctuationAfter: '' },
            { role: 'pages', labelTh: 'เลขหน้า.', labelEn: 'Pages.', sampleEn: '112-28.', sampleTh: '45-62.', punctuationAfter: '' },
          ],
          inTextParentheticalEn: '[1]',
          inTextNarrativeEn: 'Vaswani et al. [1]',
          inTextParentheticalTh: '[1]',
          inTextNarrativeTh: 'สมชาย ใจดี และคณะ [1]',
          verificationTipsTh: [
            'รูปแบบมาตรฐานการแพทย์ NLM: ปีพิมพ์;ปีที่(ฉบับที่):เลขหน้า. ติดกันทั้งหมด เช่น 2023;48(2):112-28.',
            'ไม่มีการใช้ตัวเอียงในทุกส่วนของรายการอ้างอิงแบบ Vancouver',
          ],
          verificationTipsEn: [
            'Compact NLM punctuation: Year;Volume(Issue):Pages. with no spaces around ";" or ":".',
            'Never italicize journal titles or volume numbers in Vancouver.',
          ],
        };
    }
  }

  if (sourceType === 'website') {
    switch (style) {
      case 'apa7':
        return {
          sourceType,
          style,
          formulaNoteTh: 'APA 7th ชื่อบทความเว็บใช้ตัวเอียง ตามด้วยชื่อเว็บไซต์ตัวตรง และลิงก์ URL ทันที (ไม่ต้องใส่คำว่า สืบค้นจาก ยกเว้นข้อมูลเปลี่ยนตลอดเวลา)',
          formulaNoteEn: 'APA 7th italicizes the Webpage Title, puts Site Name in plain text, and ends directly with the URL.',
          tokens: [
            { role: 'author', labelTh: 'ผู้แต่ง/หน่วยงาน', labelEn: 'Author / Org', sampleEn: 'World Health Organization.', sampleTh: 'สำนักงานสภาพัฒนาการเศรษฐกิจและสังคมแห่งชาติ.', punctuationAfter: ' ' },
            { role: 'year', labelTh: '(ปี, วัน เดือน).', labelEn: '(Year, Month Day).', sampleEn: '(2024, March 15).', sampleTh: '(2567, 15 มีนาคม).', punctuationAfter: ' ' },
            { role: 'title', labelTh: 'ชื่อหน้าเว็บเพจ/บทความ.', labelEn: 'Title of webpage.', sampleEn: 'Ethics and governance of artificial intelligence for health.', sampleTh: 'รายงานภาวะสังคมไทยไตรมาสที่หนึ่ง ปี 2567.', italic: true, punctuationAfter: ' ' },
            { role: 'container', labelTh: 'ชื่อเว็บไซต์.', labelEn: 'Site Name.', sampleEn: 'WHO Portal.', sampleTh: 'สภาพัฒน์.', punctuationAfter: ' ' },
            { role: 'locator', labelTh: 'URL', labelEn: 'URL', sampleEn: 'https://www.who.int/publications/i/item/9789240029200', sampleTh: 'https://www.nesdc.go.th/social-report-2567', punctuationAfter: '' },
          ],
          inTextParentheticalEn: '(World Health Organization, 2024)',
          inTextNarrativeEn: 'World Health Organization (2024)',
          inTextParentheticalTh: '(สำนักงานสภาพัฒนาการเศรษฐกิจและสังคมแห่งชาติ, 2567)',
          inTextNarrativeTh: 'สำนักงานสภาพัฒนาการเศรษฐกิจและสังคมแห่งชาติ (2567)',
          verificationTipsTh: [
            'หากชื่อผู้แต่งกับชื่อเว็บไซต์ซ้ำกัน ให้ตัดชื่อเว็บไซต์ออกเพื่อไม่ให้ซ้ำซ้อน',
            'ไม่ต้องใส่จุด (.) ปิดท้ายหลัง URL',
          ],
          verificationTipsEn: [
            'If Author and Site Name are identical, omit the Site Name to avoid repetition.',
            'Do NOT put a period at the end of the URL.',
          ],
        };
      default:
        return {
          sourceType,
          style,
          formulaNoteTh: `รูปแบบการอ้างอิงเว็บไซต์ตามเกณฑ์ ${CITATION_STYLE_LABELS[style].name} พร้อมระบุวันเข้าถึงข้อมูล (Access Date) และ URL`,
          formulaNoteEn: `Website citation format in ${CITATION_STYLE_LABELS[style].name} including publication date, site container, and URL.`,
          tokens: [
            { role: 'author', labelTh: 'ผู้แต่ง/องค์กร.', labelEn: 'Author / Organization.', sampleEn: 'World Health Organization.', sampleTh: 'สำนักงานสภาพัฒนาการเศรษฐกิจและสังคมแห่งชาติ.', punctuationAfter: ' ' },
            { role: 'year', labelTh: '(ปีพิมพ์).', labelEn: '(Year).', sampleEn: style === 'mla9' || style === 'vancouver' ? '2024.' : '(2024).', sampleTh: style === 'mla9' || style === 'vancouver' ? '2567.' : '(2567).', punctuationAfter: ' ' },
            { role: 'title', labelTh: 'ชื่อหน้าเว็บเพจ.', labelEn: 'Webpage Title.', sampleEn: 'Ethics and Governance of Artificial Intelligence for Health.', sampleTh: 'รายงานภาวะสังคมไทยไตรมาสที่หนึ่ง ปี 2567.', italic: style !== 'vancouver' && style !== 'mla9', quotes: style === 'mla9' || style === 'chicago', punctuationAfter: ' ' },
            { role: 'container', labelTh: 'ชื่อเว็บไซต์.', labelEn: 'Website Name.', sampleEn: 'World Health Organization,', sampleTh: 'เว็บไซต์สภาพัฒน์,', italic: style === 'mla9' || style === 'chicago', punctuationAfter: ' ' },
            { role: 'locator', labelTh: 'วันสืบค้น & URL', labelEn: 'Accessed Date & URL', sampleEn: 'Accessed 15 Mar. 2024. https://www.who.int/publications/ai-health', sampleTh: 'สืบค้นเมื่อ 15 มีนาคม 2567, จาก https://www.nesdc.go.th', punctuationAfter: '' },
          ],
          inTextParentheticalEn: style === 'vancouver' ? '[1]' : '(World Health Organization, 2024)',
          inTextNarrativeEn: style === 'vancouver' ? 'World Health Organization [1]' : 'World Health Organization (2024)',
          inTextParentheticalTh: style === 'vancouver' ? '[1]' : '(สภาพัฒน์, 2567)',
          inTextNarrativeTh: style === 'vancouver' ? 'สภาพัฒน์ [1]' : 'สภาพัฒน์ (2567)',
          verificationTipsTh: [
            'ตรวจสอบความถูกต้องของ URL ที่ใช้งานได้จริง และระบุวันเดือนปีที่เข้าถึงข้อมูลหากเนื้อหาเปลี่ยนแปลงบ่อย',
          ],
          verificationTipsEn: [
            'Verify that the full URL is active and include the access date for dynamic web content.',
          ],
        };
    }
  }

  if (sourceType === 'thesis') {
    return {
      sourceType,
      style,
      formulaNoteTh:
        style === 'apa7'
          ? 'APA 7th ระบุระดับวิทยานิพนธ์และชื่อมหาวิทยาลัยในเครื่องหมายวงเล็บเหลี่ยม [วิทยานิพนธ์ปริญญามหาบัณฑิต, ชื่อมหาวิทยาลัย] ตามด้วยฐานข้อมูลหรือ URL'
          : `รูปแบบการอ้างอิงวิทยานิพนธ์และดุษฎีนิพนธ์ตามมาตรฐาน ${CITATION_STYLE_LABELS[style].name}`,
      formulaNoteEn:
        style === 'apa7'
          ? 'APA 7th places [Master’s thesis, University Name] or [Doctoral dissertation, University Name] in square brackets after the italicized title.'
          : `Thesis and Dissertation citation format in ${CITATION_STYLE_LABELS[style].name}.`,
      tokens: [
        { role: 'author', labelTh: 'ผู้วิจัย', labelEn: 'Author', sampleEn: 'Srisawat, N.', sampleTh: 'ณัฐพล ศรีสวัสดิ์.', punctuationAfter: ' ' },
        { role: 'year', labelTh: '(ปีพิมพ์).', labelEn: '(Year).', sampleEn: style === 'vancouver' ? '' : '(2023).', sampleTh: style === 'vancouver' ? '' : '(2566).', punctuationAfter: ' ' },
        { role: 'title', labelTh: 'ชื่อวิทยานิพนธ์', labelEn: 'Thesis title', sampleEn: 'Deep learning models for automated Thai academic citation parsing', sampleTh: 'การพัฒนาระบบวิเคราะห์และจัดรูปแบบบรรณานุกรมภาษาไทยด้วยปัญญาประดิษฐ์', italic: style !== 'vancouver', quotes: style === 'chicago', punctuationAfter: ' ' },
        { role: 'edition', labelTh: '[ระดับวิทยานิพนธ์, มหาวิทยาลัย].', labelEn: '[Thesis Type, University].', sampleEn: '[Doctoral dissertation, Chulalongkorn University].', sampleTh: '[วิทยานิพนธ์ปริญญาดุษฎีบัณฑิต, จุฬาลงกรณ์มหาวิทยาลัย].', punctuationAfter: ' ' },
        { role: 'publisher', labelTh: 'ฐานข้อมูล/คลังปัญญา.', labelEn: 'Repository / Archive.', sampleEn: 'Chula ETD.', sampleTh: 'คลังปัญญาจุฬาฯ (CUIR).', punctuationAfter: ' ' },
        { role: 'locator', labelTh: 'URL', labelEn: 'URL', sampleEn: 'https://cuir.car.chula.ac.th/handle/123456789/89012', sampleTh: 'https://cuir.car.chula.ac.th/handle/123456789/89012', punctuationAfter: '' },
      ],
      inTextParentheticalEn: style === 'vancouver' ? '[1]' : '(Srisawat, 2023)',
      inTextNarrativeEn: style === 'vancouver' ? 'Srisawat [1]' : 'Srisawat (2023)',
      inTextParentheticalTh: style === 'vancouver' ? '[1]' : '(ณัฐพล ศรีสวัสดิ์, 2566)',
      inTextNarrativeTh: style === 'vancouver' ? 'ณัฐพล ศรีสวัสดิ์ [1]' : 'ณัฐพล ศรีสวัสดิ์ (2566)',
      verificationTipsTh: [
        'ชื่อวิทยานิพนธ์ใช้ตัวเอียง (ยกเว้น Chicago และ Vancouver)',
        'ใน APA 7th ให้ใส่ [วิทยานิพนธ์ปริญญามหาบัณฑิต, ชื่อมหาวิทยาลัย] ในวงเล็บเหลี่ยมตัวตรงหลังชื่อเรื่อง',
      ],
      verificationTipsEn: [
        'Italicize the thesis title (except in Chicago/Vancouver) and put [Doctoral dissertation, University Name] in square brackets for APA 7th.',
      ],
    };
  }

  if (sourceType === 'chapter') {
    return {
      sourceType,
      style,
      formulaNoteTh: 'บทในหนังสือ (Book Chapter): ชื่อบทความตัวตรง ตามด้วยคำว่า In / ใน ชื่อบรรณาธิการ (Ed. / บ.ก.), ชื่อหนังสือตัวเอียง (หน้า xx–xx). สำนักพิมพ์.',
      formulaNoteEn: 'Book Chapter: Chapter title in plain text, followed by "In Editor (Ed.)," Italicized Book Title (pp. xx–xx). Publisher.',
      tokens: [
        { role: 'author', labelTh: 'ผู้เขียนบท', labelEn: 'Chapter Author', sampleEn: 'Denzin, N. K., & Lincoln, Y. S.', sampleTh: 'สุภางค์ จันทวานิช.', punctuationAfter: ' ' },
        { role: 'year', labelTh: '(ปีพิมพ์).', labelEn: '(Year).', sampleEn: '(2022).', sampleTh: '(2565).', punctuationAfter: ' ' },
        { role: 'title', labelTh: 'ชื่อบทในหนังสือ.', labelEn: 'Chapter title.', sampleEn: 'The discipline and practice of qualitative research.', sampleTh: 'การวิเคราะห์ข้อมูลในการวิจัยเชิงคุณภาพ.', italic: false, punctuationAfter: ' ' },
        { role: 'edition', labelTh: 'ใน ชื่อบรรณาธิการ (บ.ก.),', labelEn: 'In Editor(s) (Eds.),', sampleEn: 'In N. K. Denzin & Y. S. Lincoln (Eds.),', sampleTh: 'ใน สุภางค์ จันทวานิช (บ.ก.),', punctuationAfter: ' ' },
        { role: 'container', labelTh: 'ชื่อหนังสือรวมบทความ', labelEn: 'Book Title', sampleEn: 'The SAGE handbook of qualitative research', sampleTh: 'วิธีการวิจัยเชิงคุณภาพ', italic: style !== 'vancouver', punctuationAfter: ' ' },
        { role: 'pages', labelTh: '(หน้า xx–xx).', labelEn: '(pp. xx–xx).', sampleEn: '(6th ed., pp. 1–32).', sampleTh: '(พิมพ์ครั้งที่ 25, น. 120–155).', punctuationAfter: ' ' },
        { role: 'publisher', labelTh: 'สำนักพิมพ์.', labelEn: 'Publisher.', sampleEn: 'SAGE Publications.', sampleTh: 'สำนักพิมพ์แห่งจุฬาลงกรณ์มหาวิทยาลัย.', punctuationAfter: '' },
      ],
      inTextParentheticalEn: style === 'vancouver' ? '[1]' : '(Denzin & Lincoln, 2022)',
      inTextNarrativeEn: style === 'vancouver' ? 'Denzin and Lincoln [1]' : 'Denzin and Lincoln (2022)',
      inTextParentheticalTh: style === 'vancouver' ? '[1]' : '(สุภางค์ จันทวานิช, 2565)',
      inTextNarrativeTh: style === 'vancouver' ? 'สุภางค์ จันทวานิช [1]' : 'สุภางค์ จันทวานิช (2565)',
      verificationTipsTh: [
        'ชื่อบทความใช้ตัวตรงธรรมดา ส่วนชื่อหนังสือหลักหลังคำว่า "In / ใน" ต้องเป็นตัวเอียง',
        'ต้องระบุช่วงเลขหน้าของบทนั้นในวงเล็บ เช่น (pp. 1–32) หรือ (น. 120–155) ก่อนจุดจบชื่อหนังสือ',
      ],
      verificationTipsEn: [
        'Chapter title is NOT italicized; the container Book Title IS italicized.',
        'Include "(pp. xx–xx)" in parentheses immediately after the book title.',
      ],
    };
  }

  if (sourceType === 'conference') {
    return {
      sourceType,
      style,
      formulaNoteTh: 'รายงานสืบเนื่องจากการประชุมวิชาการ (Conference Proceedings): ระบุชื่อผู้แต่ง ปี ชื่อบทความ ชื่อการประชุมวิชาการ เลขหน้า และสถานที่/ผู้จัด',
      formulaNoteEn: 'Conference Paper / Proceedings: Author, Year, Paper Title, Conference Title (italicized), page range, and Publisher/DOI.',
      tokens: [
        { role: 'author', labelTh: 'ผู้แต่ง', labelEn: 'Author(s)', sampleEn: 'Devlin, J., Chang, M.-W., Lee, K., & Toutanova, K.', sampleTh: 'กิตติพงศ์ พงษ์สวัสดิ์, และ อรอนงค์ วงศ์สกุล.', punctuationAfter: ' ' },
        { role: 'year', labelTh: '(ปีพิมพ์).', labelEn: '(Year).', sampleEn: '(2019).', sampleTh: '(2566).', punctuationAfter: ' ' },
        { role: 'title', labelTh: 'ชื่อบทความวิจัย.', labelEn: 'Paper title.', sampleEn: 'BERT: Pre-training of deep bidirectional transformers for language understanding.', sampleTh: 'การประยุกต์ใช้โมเดลภาษาขนาดใหญ่เพื่อสกัดข้อมูลบรรณานุกรมอัตโนมัติ.', italic: false, punctuationAfter: ' ' },
        { role: 'container', labelTh: 'ชื่อรายงานการประชุมวิชาการ', labelEn: 'Proceedings Title', sampleEn: 'Proceedings of the 2019 Conference of the North American Chapter of the Association for Computational Linguistics', sampleTh: 'รายงานสืบเนื่องจากการประชุมวิชาการระดับชาติ ด้านเทคโนโลยีสารสนเทศ ครั้งที่ 15', italic: style !== 'vancouver', punctuationAfter: ' ' },
        { role: 'pages', labelTh: '(หน้า xx–xx).', labelEn: '(pp. xx–xx).', sampleEn: '(pp. 4171–4186).', sampleTh: '(น. 85–94).', punctuationAfter: ' ' },
        { role: 'publisher', labelTh: 'ผู้จัด/สำนักพิมพ์.', labelEn: 'Publisher.', sampleEn: 'Association for Computational Linguistics.', sampleTh: 'สมาคมเทคโนโลยีสารสนเทศแห่งประเทศไทย.', punctuationAfter: ' ' },
        { role: 'locator', labelTh: 'DOI', labelEn: 'DOI', sampleEn: 'https://doi.org/10.18653/v1/N19-1423', sampleTh: 'https://doi.org/10.14456/ncit.2023.12', punctuationAfter: '' },
      ],
      inTextParentheticalEn: style === 'vancouver' ? '[1]' : '(Devlin et al., 2019)',
      inTextNarrativeEn: style === 'vancouver' ? 'Devlin et al. [1]' : 'Devlin et al. (2019)',
      inTextParentheticalTh: style === 'vancouver' ? '[1]' : '(กิตติพงศ์ พงษ์สวัสดิ์ และ อรอนงค์ วงศ์สกุล, 2566)',
      inTextNarrativeTh: style === 'vancouver' ? 'กิตติพงศ์ พงษ์สวัสดิ์ และ อรอนงค์ วงศ์สกุล [1]' : 'กิตติพงศ์ พงษ์สวัสดิ์ และ อรอนงค์ วงศ์สกุล (2566)',
      verificationTipsTh: [
        'ตรวจสอบให้มีชื่อการประชุมวิชาการ (Proceedings) และเลขหน้า (pp. / น.) ครบถ้วน',
      ],
      verificationTipsEn: [
        'Ensure the full Conference Proceedings title is italicized and page numbers (pp.) are included.',
      ],
    };
  }

  // newspaper
  return {
    sourceType: 'newspaper',
    style,
    formulaNoteTh: 'บทความหนังสือพิมพ์: ต้องระบุ ปี, วัน เดือน ในวงเล็บ ชื่อบทความตัวตรง ชื่อหนังสือพิมพ์ตัวเอียง และเลขหน้าหรือ URL',
    formulaNoteEn: 'Newspaper Article: Include full publication date (Year, Month Day), article title in plain text, and italicized Newspaper Title.',
    tokens: [
      { role: 'author', labelTh: 'ผู้เขียนข่าว/คอลัมนิสต์', labelEn: 'Author', sampleEn: 'Metz, C.', sampleTh: 'กองบรรณาธิการประชาชาติธุรกิจ.', punctuationAfter: ' ' },
      { role: 'year', labelTh: '(ปี, วัน เดือน).', labelEn: '(Year, Month Day).', sampleEn: '(2024, May 10).', sampleTh: '(2567, 10 พฤษภาคม).', punctuationAfter: ' ' },
      { role: 'title', labelTh: 'ชื่อพาดหัวข่าว/บทความ.', labelEn: 'Article headline.', sampleEn: 'How generative AI is reshaping academic research workflows.', sampleTh: 'ทิศทางมหาวิทยาลัยไทยในยุคปัญญาประดิษฐ์เพื่องานวิจัย.', italic: false, punctuationAfter: ' ' },
      { role: 'container', labelTh: 'ชื่อหนังสือพิมพ์,', labelEn: 'Newspaper Title,', sampleEn: 'The New York Times,', sampleTh: 'ประชาชาติธุรกิจ,', italic: style !== 'vancouver', punctuationAfter: ' ' },
      { role: 'pages', labelTh: 'เลขหน้า/URL.', labelEn: 'Page / URL.', sampleEn: 'B1. https://www.nytimes.com/2024/05/10/technology/ai-research.html', sampleTh: 'น. 8. https://www.prachachat.net/education/news-156000', punctuationAfter: '' },
    ],
    inTextParentheticalEn: style === 'vancouver' ? '[1]' : '(Metz, 2024)',
    inTextNarrativeEn: style === 'vancouver' ? 'Metz [1]' : 'Metz (2024)',
    inTextParentheticalTh: style === 'vancouver' ? '[1]' : '(กองบรรณาธิการประชาชาติธุรกิจ, 2567)',
    inTextNarrativeTh: style === 'vancouver' ? 'กองบรรณาธิการประชาชาติธุรกิจ [1]' : 'กองบรรณาธิการประชาชาติธุรกิจ (2567)',
    verificationTipsTh: [
      'หนังสือพิมพ์ต้องระบุ วันและเดือน ที่ตีพิมพ์ควบคู่กับปี พ.ศ./ค.ศ. เสมอ',
      'ชื่อหนังสือพิมพ์ใช้ตัวเอียง ส่วนชื่อบทความข่าวใช้ตัวตรง',
    ],
    verificationTipsEn: [
      'Always include the exact Month and Day along with the Year for newspaper articles.',
      'Italicize the Newspaper name, not the article headline.',
    ],
  };
}

const ALL_STYLES: CitationStyle[] = ['apa7', 'apa6', 'mla9', 'chicago', 'harvard', 'vancouver'];
const ALL_SOURCE_TYPES: SourceType[] = [
  'book',
  'journal',
  'website',
  'thesis',
  'chapter',
  'conference',
  'newspaper',
];

export const CitationCheatSheetModal: React.FC<CitationCheatSheetModalProps> = ({
  isOpen,
  onClose,
  currentStyle,
  onChangeStyle,
  entries,
  onEditEntry,
}) => {
  const { t } = useLanguage();
  const [selectedStyle, setSelectedStyle] = useState<CitationStyle>(currentStyle);
  const [selectedSourceType, setSelectedSourceType] = useState<SourceType | 'all'>('book');
  const [exampleLangMode, setExampleLangMode] = useState<'both' | 'th' | 'en'>('both');
  const [activeTokenRole, setActiveTokenRole] = useState<TokenRole | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedUserEntryId, setSelectedUserEntryId] = useState<string>('auto');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Keep selectedStyle synced when modal opens if desired
  React.useEffect(() => {
    if (isOpen) {
      setSelectedStyle(currentStyle);
    }
  }, [isOpen, currentStyle]);

  const displayedSourceTypes = useMemo(() => {
    if (selectedSourceType === 'all') return ALL_SOURCE_TYPES;
    return [selectedSourceType];
  }, [selectedSourceType]);

  // Filter user entries for the live output verifier
  const matchingUserEntries = useMemo(() => {
    const byType =
      selectedSourceType === 'all'
        ? entries
        : entries.filter((e) => e.sourceType === selectedSourceType);

    if (!searchTerm.trim()) return byType;
    const q = searchTerm.toLowerCase();
    return byType.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.containerTitle || '').toLowerCase().includes(q) ||
        (e.publisher || '').toLowerCase().includes(q) ||
        e.authors.some((a) => `${a.firstName} ${a.lastName}`.toLowerCase().includes(q))
    );
  }, [entries, selectedSourceType, searchTerm]);

  const activeUserEntry = useMemo(() => {
    if (selectedUserEntryId !== 'auto') {
      const found = entries.find((e) => e.id === selectedUserEntryId);
      if (found) return found;
    }
    if (matchingUserEntries.length > 0) return matchingUserEntries[0];
    return entries[0] || null;
  }, [entries, matchingUserEntries, selectedUserEntryId]);

  if (!isOpen) return null;

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Evaluate field-by-field verification status of activeUserEntry against the Cheat Sheet
  const evaluateUserEntryChecklist = (entry: BibliographyEntry) => {
    const hasAuthor = entry.authors.some(
      (a) => a.firstName.trim() || a.lastName.trim()
    );
    const hasYear = Boolean(entry.year && entry.year.trim());
    const hasTitle = Boolean(entry.title && entry.title.trim());

    const checks: {
      role: TokenRole;
      labelTh: string;
      labelEn: string;
      passed: boolean;
      value: string;
      hintTh: string;
      hintEn: string;
    }[] = [
      {
        role: 'author',
        labelTh: 'ชื่อผู้แต่ง / องค์กร (Author)',
        labelEn: 'Author / Organization',
        passed: hasAuthor,
        value: hasAuthor
          ? entry.authors
              .map((a) => `${a.firstName} ${a.lastName}`.trim())
              .join(', ')
          : t('ยังไม่ระบุผู้แต่ง', 'Missing author'),
        hintTh: 'ต้องระบุชื่อ-นามสกุลผู้แต่ง หรือชื่อหน่วยงานเจ้าของบทความ',
        hintEn: 'Author surname and initials or organization name required',
      },
      {
        role: 'year',
        labelTh: 'ปีที่พิมพ์ (Publication Year)',
        labelEn: 'Publication Year',
        passed: hasYear,
        value: hasYear ? entry.year : t('ยังไม่ระบุปีพิมพ์ (ใช้ n.d. / ม.ป.ป.)', 'Missing year'),
        hintTh: 'หนังสือพิมพ์และเว็บไซต์ควรระบุ วัน และ เดือน ร่วมด้วยหากมี',
        hintEn: 'Include year (and Month/Day for websites & newspapers)',
      },
      {
        role: 'title',
        labelTh: 'ชื่อเรื่องและรูปแบบตัวเอียง (Title & Italics)',
        labelEn: 'Title & Typography',
        passed: hasTitle,
        value: hasTitle ? entry.title : t('ยังไม่ระบุชื่อเรื่อง', 'Missing title'),
        hintTh:
          entry.sourceType === 'journal' || entry.sourceType === 'chapter'
            ? 'บทความวารสาร/บทในหนังสือ ใช้ตัวตรงธรรมดา (ไม่เอียง)'
            : selectedStyle === 'vancouver'
            ? 'Vancouver ใช้ตัวตรงธรรมดาทุกแหล่งข้อมูล'
            : 'หนังสือ/วิทยานิพนธ์/เว็บเพจ ต้องใช้ตัวเอียง (Italics)',
        hintEn:
          entry.sourceType === 'journal' || entry.sourceType === 'chapter'
            ? 'Article/chapter title is plain text (not italicized)'
            : selectedStyle === 'vancouver'
            ? 'Vancouver uses plain text without italics'
            : 'Book/thesis/webpage title is automatically italicized',
      },
    ];

    if (entry.sourceType === 'journal') {
      const hasJournal = Boolean(entry.containerTitle && entry.containerTitle.trim());
      const hasVol = Boolean(entry.volume && entry.volume.trim());
      const hasPages = Boolean(entry.pages && entry.pages.trim());
      checks.push(
        {
          role: 'container',
          labelTh: 'ชื่อวารสารวิชาการ (Journal Name)',
          labelEn: 'Journal Title (Italicized)',
          passed: hasJournal,
          value: hasJournal
            ? entry.containerTitle || ''
            : t('ขาดชื่อวารสาร', 'Missing journal title'),
          hintTh: 'ชื่อวารสารต้องเป็นตัวเอียง (ยกเว้น Vancouver)',
          hintEn: 'Journal title must be italicized (except in Vancouver)',
        },
        {
          role: 'volume',
          labelTh: 'ปีที่และฉบับที่ (Volume & Issue)',
          labelEn: 'Volume & Issue',
          passed: hasVol,
          value: hasVol
            ? `${entry.volume || ''}${entry.issue ? `(${entry.issue})` : ''}`
            : t('ขาดเลขปีที่ (Volume)', 'Missing volume number'),
          hintTh: 'ใน APA เลขปีที่ (Volume) เป็นตัวเอียง ส่วน (Issue) เป็นตัวตรงติดกัน',
          hintEn: 'In APA, Volume is italicized and (Issue) is plain text with no space',
        },
        {
          role: 'pages',
          labelTh: 'เลขหน้าของบทความ (Page Range)',
          labelEn: 'Page Numbers',
          passed: hasPages,
          value: hasPages ? entry.pages || '' : t('ขาดเลขหน้า', 'Missing page numbers'),
          hintTh: 'ระบุช่วงเลขหน้า เช่น 112–128',
          hintEn: 'Specify page range, e.g., 112–128',
        }
      );
    } else if (entry.sourceType === 'book') {
      const hasPublisher = Boolean(entry.publisher && entry.publisher.trim());
      checks.push({
        role: 'publisher',
        labelTh: 'สำนักพิมพ์ (Publisher)',
        labelEn: 'Publisher',
        passed: hasPublisher,
        value: hasPublisher ? entry.publisher || '' : t('ขาดชื่อสำนักพิมพ์', 'Missing publisher'),
        hintTh:
          selectedStyle === 'apa6' || selectedStyle === 'chicago' || selectedStyle === 'harvard'
            ? 'ต้องระบุ เมืองที่พิมพ์: สำนักพิมพ์'
            : 'APA 7th ระบุเฉพาะชื่อสำนักพิมพ์ (ตัดเมืองที่พิมพ์ออก)',
        hintEn:
          selectedStyle === 'apa6' || selectedStyle === 'chicago' || selectedStyle === 'harvard'
            ? 'Requires City: Publisher'
            : 'APA 7th requires Publisher name only (no city)',
      });
    } else if (entry.sourceType === 'website') {
      const hasUrl = Boolean(entry.url && entry.url.trim());
      checks.push({
        role: 'locator',
        labelTh: 'ลิงก์เว็บไซต์ (URL)',
        labelEn: 'Website URL',
        passed: hasUrl,
        value: hasUrl ? entry.url || '' : t('ขาดลิงก์ URL', 'Missing URL'),
        hintTh: 'ระบุ URL เต็มที่ขึ้นต้นด้วย https:// โดยไม่มีจุดปิดท้าย',
        hintEn: 'Provide full https:// URL without a trailing period',
      });
    } else if (entry.sourceType === 'thesis') {
      const hasUni = Boolean(
        (entry.institution && entry.institution.trim()) ||
          (entry.publisher && entry.publisher.trim())
      );
      checks.push({
        role: 'publisher',
        labelTh: 'มหาวิทยาลัยและระดับปริญญา (University & Degree)',
        labelEn: 'University & Thesis Type',
        passed: hasUni,
        value: hasUni
          ? `${entry.degreeType || 'วิทยานิพนธ์'}, ${entry.institution || entry.publisher || ''}`
          : t('ขาดชื่อมหาวิทยาลัย', 'Missing university name'),
        hintTh: 'APA 7th แสดงในวงเล็บเหลี่ยม [วิทยานิพนธ์..., ชื่อมหาวิทยาลัย]',
        hintEn: 'APA 7th formats as [Master’s thesis / Doctoral dissertation, University]',
      });
    }

    return checks;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-5 sm:px-7 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-indigo-900/60">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-lg shrink-0">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight font-sarabun">
                  {t(
                    'ตารางเทียบโครงสร้างและตัวอย่างบรรณานุกรม (Visual Citation Style Cheat Sheets)',
                    'Visual Citation Style Cheat Sheets & Live Output Verifier'
                  )}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-200 border border-amber-300/30">
                  {t('ครบทั้ง 6 มาตรฐาน • 7 ประเภทแหล่งข้อมูล', '6 Citation Styles • 7 Source Types')}
                </span>
              </div>
              <p className="text-xs text-indigo-200/90 font-sarabun mt-0.5">
                {t(
                  'แยกสีโครงสร้างบรรณานุกรมแต่ละส่วน (ผู้แต่ง • ปีพิมพ์ • ชื่อเรื่อง • ตัวเอียง • เครื่องหมายวรรคตอน) พร้อมเทียบเคียงกับรายการจริงของคุณแบบจุดต่อจุด',
                  'Color-coded visual anatomy of every citation style (Author, Year, Italics, Punctuation) with side-by-side verification against your own entries.'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedStyle !== currentStyle && (
              <button
                type="button"
                onClick={() => onChangeStyle(selectedStyle)}
                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {t(
                    `ตั้งค่าโปรเจกต์เป็น ${CITATION_STYLE_LABELS[selectedStyle].name}`,
                    `Switch Project to ${CITATION_STYLE_LABELS[selectedStyle].name}`
                  )}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/85 hover:text-white transition-colors cursor-pointer"
              title={t('ปิดหน้าต่าง', 'Close modal')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sticky Control Bar: Style Selector + Source Type Selector + Language Filter */}
        <div className="px-5 sm:px-7 py-3.5 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
          {/* Row 1: Citation Style Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 mr-1 font-sarabun">
                {t('1. เลือกรูปแบบ (Citation Style):', '1. Select Citation Style:')}
              </span>
              {ALL_STYLES.map((st) => {
                const isSelected = selectedStyle === st;
                const isProjectActive = currentStyle === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelectedStyle(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? `${STYLE_BADGE_COLORS[st]} shadow-xs scale-[1.02]`
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{CITATION_STYLE_LABELS[st].name}</span>
                    {isProjectActive && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold ${
                          isSelected
                            ? 'bg-white/25 text-white'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {t('ใช้อยู่', 'Active')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Example Language Toggle */}
            <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-200/80 border border-slate-300 text-xs font-bold">
              <button
                type="button"
                onClick={() => setExampleLangMode('both')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  exampleLangMode === 'both'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('ไทย + อังกฤษ', 'TH + EN')}
              </button>
              <button
                type="button"
                onClick={() => setExampleLangMode('th')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  exampleLangMode === 'th'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('เฉพาะภาษาไทย', 'Thai Only')}
              </button>
              <button
                type="button"
                onClick={() => setExampleLangMode('en')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  exampleLangMode === 'en'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('เฉพาะภาษาอังกฤษ', 'English Only')}
              </button>
            </div>
          </div>

          {/* Row 2: Source Type Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 mr-1 font-sarabun">
              {t('2. เลือกประเภทแหล่งข้อมูล (Source Type):', '2. Select Source Type:')}
            </span>
            {ALL_SOURCE_TYPES.map((srcType) => {
              const isSelected = selectedSourceType === srcType;
              const countInProject = entries.filter((e) => e.sourceType === srcType).length;
              return (
                <button
                  key={srcType}
                  type="button"
                  onClick={() => {
                    setSelectedSourceType(srcType);
                    setSelectedUserEntryId('auto');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {SOURCE_ICONS[srcType]}
                  <span>
                    {t(SOURCE_TYPE_LABELS[srcType].th, SOURCE_TYPE_LABELS[srcType].en)}
                  </span>
                  {countInProject > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {countInProject}
                    </span>
                  )}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setSelectedSourceType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedSourceType === 'all'
                  ? 'bg-indigo-700 text-white border-indigo-700 shadow-xs'
                  : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{t('ดูทุกประเภทพร้อมกัน (All 7 Types)', 'View All 7 Types')}</span>
            </button>
          </div>
        </div>

        {/* Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 bg-slate-100/70">
          {/* Interactive Color-Code Legend */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 font-sarabun">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                {t(
                  'คลิกที่แถบสีด้านล่างเพื่อเน้นตำแหน่งของข้อมูลแต่ละส่วนในตัวอย่างบรรณานุกรม:',
                  'Click any color tag below to highlight that element in the visual examples:'
                )}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(Object.keys(TOKEN_ROLE_STYLES) as TokenRole[]).map((role) => {
                const st = TOKEN_ROLE_STYLES[role];
                const isActive = activeTokenRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setActiveTokenRole(isActive ? null : role)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                      isActive
                        ? `${st.badgeBg} border-transparent ring-2 ring-offset-1 ring-indigo-500`
                        : `${st.bg} ${st.border} ${st.text} hover:opacity-85`
                    }`}
                  >
                    {t(st.nameTh, st.nameEn)}
                  </button>
                );
              })}
              {activeTokenRole && (
                <button
                  type="button"
                  onClick={() => setActiveTokenRole(null)}
                  className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                >
                  {t('ล้างตัวเน้น', 'Clear Highlight')}
                </button>
              )}
            </div>
          </div>

          {/* Cheat Sheet Cards for Displayed Source Types */}
          <div className="space-y-6">
            {displayedSourceTypes.map((srcType) => {
              const sheet = buildCheatSheetItem(selectedStyle, srcType);

              const fullEnPlain = sheet.tokens
                .map((tk) => `${tk.sampleEn}${tk.punctuationAfter || ''}`)
                .join('')
                .trim();
              const fullThPlain = sheet.tokens
                .map((tk) => `${tk.sampleTh}${tk.punctuationAfter || ''}`)
                .join('')
                .trim();

              return (
                <div
                  key={`${selectedStyle}-${srcType}`}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden"
                >
                  {/* Card Banner */}
                  <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-amber-300">
                        {SOURCE_ICONS[srcType]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-extrabold font-sarabun">
                            {t(
                              `${SOURCE_TYPE_LABELS[srcType].th} (${SOURCE_TYPE_LABELS[srcType].en})`,
                              `${SOURCE_TYPE_LABELS[srcType].en} (${SOURCE_TYPE_LABELS[srcType].th})`
                            )}
                          </h3>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-500/30 text-indigo-100 border border-indigo-400/30">
                            {CITATION_STYLE_LABELS[selectedStyle].name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 font-sarabun mt-0.5">
                          {t(sheet.formulaNoteTh, sheet.formulaNoteEn)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-5">
                    {/* SECTION 1: Visual Formula / Anatomy Breakdown */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 font-sarabun">
                          {t(
                            'โครงสร้างและลำดับเครื่องหมายวรรคตอน (Visual Citation Formula & Anatomy)',
                            'Visual Citation Formula & Punctuation Anatomy'
                          )}
                        </span>
                        <span className="text-[11px] text-slate-400 font-sarabun">
                          {t(
                            'สังเกตตำแหน่งจุด (.) จุลภาค (,) ตัวเอียง (Italics) และวงเล็บ',
                            'Notice exact periods (.), commas (,), italics, and parentheses'
                          )}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-wrap items-center gap-2">
                        {sheet.tokens
                          .filter((tk) => tk.sampleEn || tk.sampleTh)
                          .map((tk, idx) => {
                            const roleStyle = TOKEN_ROLE_STYLES[tk.role];
                            const isDimmed =
                              activeTokenRole !== null && activeTokenRole !== tk.role;
                            return (
                              <div
                                key={idx}
                                onClick={() =>
                                  setActiveTokenRole(
                                    activeTokenRole === tk.role ? null : tk.role
                                  )
                                }
                                className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex flex-col gap-0.5 ${
                                  roleStyle.bg
                                } ${roleStyle.border} ${roleStyle.text} ${
                                  isDimmed ? 'opacity-30 scale-95' : 'shadow-2xs hover:scale-[1.02]'
                                }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${roleStyle.badgeBg}`}
                                  >
                                    {idx + 1}
                                  </span>
                                  <span className="text-xs font-extrabold font-sarabun">
                                    {t(tk.labelTh, tk.labelEn)}
                                  </span>
                                  {tk.italic && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-200/90 text-amber-950">
                                      Italic (ตัวเอียง)
                                    </span>
                                  )}
                                  {tk.quotes && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-200/90 text-rose-950">
                                      &ldquo;Quotes&rdquo;
                                    </span>
                                  )}
                                </div>
                                <div
                                  className={`text-xs text-slate-700 font-sarabun truncate max-w-[260px] ${
                                    tk.italic ? 'italic font-medium' : ''
                                  }`}
                                >
                                  {exampleLangMode === 'th' ? tk.sampleTh : tk.sampleEn}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* SECTION 2: Golden Standard Examples (Hanging Indent Paper Preview) */}
                    <div
                      className={`grid grid-cols-1 ${
                        exampleLangMode === 'both' ? 'lg:grid-cols-2' : ''
                      } gap-4`}
                    >
                      {/* Thai Example Card */}
                      {(exampleLangMode === 'both' || exampleLangMode === 'th') && (
                        <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/35 p-4 flex flex-col justify-between space-y-3">
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-600 text-white font-sarabun">
                                {t(
                                  'ตัวอย่างบรรณานุกรมภาษาไทย (เกณฑ์บัณฑิตวิทยาลัย)',
                                  'Thai Reference Example (Graduate School Standard)'
                                )}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyText(fullThPlain, `th-${selectedStyle}-${srcType}`)
                                }
                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                {copiedId === `th-${selectedStyle}-${srcType}` ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-emerald-700">
                                      {t('คัดลอกแล้ว', 'Copied')}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>{t('คัดลอกตัวอย่าง', 'Copy Example')}</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Paper Simulation Box with Hanging Indent */}
                            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                              <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                                <span>
                                  {selectedStyle === 'vancouver'
                                    ? t('รูปแบบลำดับหมายเลข [1]', 'Numbered Format [1]')
                                    : t(
                                        'ย่อหน้าเยื้องแขวน (Hanging Indent 0.5 นิ้ว)',
                                        'Hanging Indent (0.5 in / 1.27 cm)'
                                      )}
                                </span>
                                <span>TH Sarabun New • 16 pt</span>
                              </div>
                              <div
                                className={`text-sm sm:text-[15px] leading-relaxed text-slate-900 font-sarabun ${
                                  selectedStyle === 'vancouver' ? '' : 'pl-8 -indent-8'
                                }`}
                              >
                                {sheet.tokens
                                  .filter((tk) => tk.sampleTh)
                                  .map((tk, i) => {
                                    const roleStyle = TOKEN_ROLE_STYLES[tk.role];
                                    const isHighlighted = activeTokenRole === tk.role;
                                    const isDimmed =
                                      activeTokenRole !== null && activeTokenRole !== tk.role;
                                    return (
                                      <span
                                        key={i}
                                        className={`transition-all rounded px-0.5 ${
                                          tk.italic ? 'italic' : ''
                                        } ${
                                          isHighlighted
                                            ? `${roleStyle.bg} ${roleStyle.text} font-bold ring-1 ${roleStyle.border}`
                                            : isDimmed
                                            ? 'opacity-35'
                                            : ''
                                        }`}
                                      >
                                        {tk.sampleTh}
                                        {tk.punctuationAfter || ''}
                                      </span>
                                    );
                                  })}
                              </div>
                            </div>
                          </div>

                          {/* In-text citations (Thai) */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            <div className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-sarabun">
                              <span className="text-slate-400 block text-[10px] font-bold uppercase">
                                {t('อ้างอิงท้ายข้อความ (Parenthetical)', 'Parenthetical In-Text')}
                              </span>
                              <span className="font-bold text-slate-800">
                                {sheet.inTextParentheticalTh}
                              </span>
                            </div>
                            <div className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-sarabun">
                              <span className="text-slate-400 block text-[10px] font-bold uppercase">
                                {t('อ้างอิงแทรกในเนื้อหา (Narrative)', 'Narrative In-Text')}
                              </span>
                              <span className="font-bold text-slate-800">
                                {sheet.inTextNarrativeTh}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* English Example Card */}
                      {(exampleLangMode === 'both' || exampleLangMode === 'en') && (
                        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/35 p-4 flex flex-col justify-between space-y-3">
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-700 text-white font-sarabun">
                                {t(
                                  'ตัวอย่างบรรณานุกรมภาษาอังกฤษ (International Standard)',
                                  'English Reference Example (International Standard)'
                                )}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyText(fullEnPlain, `en-${selectedStyle}-${srcType}`)
                                }
                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                {copiedId === `en-${selectedStyle}-${srcType}` ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-emerald-700">
                                      {t('คัดลอกแล้ว', 'Copied')}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>{t('คัดลอกตัวอย่าง', 'Copy Example')}</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Paper Simulation Box with Hanging Indent */}
                            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                              <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                                <span>
                                  {selectedStyle === 'vancouver'
                                    ? t('รูปแบบลำดับหมายเลข [1]', 'Numbered Format [1]')
                                    : t(
                                        'ย่อหน้าเยื้องแขวน (Hanging Indent 0.5 นิ้ว)',
                                        'Hanging Indent (0.5 in / 1.27 cm)'
                                      )}
                                </span>
                                <span>Times New Roman / Sarabun</span>
                              </div>
                              <div
                                className={`text-sm sm:text-[15px] leading-relaxed text-slate-900 font-serif ${
                                  selectedStyle === 'vancouver' ? '' : 'pl-8 -indent-8'
                                }`}
                              >
                                {sheet.tokens
                                  .filter((tk) => tk.sampleEn)
                                  .map((tk, i) => {
                                    const roleStyle = TOKEN_ROLE_STYLES[tk.role];
                                    const isHighlighted = activeTokenRole === tk.role;
                                    const isDimmed =
                                      activeTokenRole !== null && activeTokenRole !== tk.role;
                                    return (
                                      <span
                                        key={i}
                                        className={`transition-all rounded px-0.5 ${
                                          tk.italic ? 'italic' : ''
                                        } ${
                                          isHighlighted
                                            ? `${roleStyle.bg} ${roleStyle.text} font-bold ring-1 ${roleStyle.border}`
                                            : isDimmed
                                            ? 'opacity-35'
                                            : ''
                                        }`}
                                      >
                                        {tk.sampleEn}
                                        {tk.punctuationAfter || ''}
                                      </span>
                                    );
                                  })}
                              </div>
                            </div>
                          </div>

                          {/* In-text citations (English) */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            <div className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-sarabun">
                              <span className="text-slate-400 block text-[10px] font-bold uppercase">
                                {t('อ้างอิงท้ายข้อความ (Parenthetical)', 'Parenthetical In-Text')}
                              </span>
                              <span className="font-bold text-slate-800">
                                {sheet.inTextParentheticalEn}
                              </span>
                            </div>
                            <div className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-sarabun">
                              <span className="text-slate-400 block text-[10px] font-bold uppercase">
                                {t('อ้างอิงแทรกในเนื้อหา (Narrative)', 'Narrative In-Text')}
                              </span>
                              <span className="font-bold text-slate-800">
                                {sheet.inTextNarrativeEn}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Key Verification Checkpoints */}
                    <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-3.5">
                      <div className="text-xs font-extrabold text-amber-900 mb-1.5 flex items-center gap-1.5 font-sarabun">
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          {t(
                            `จุดสังเกตสำคัญเพื่อตรวจสอบความถูกต้อง (${CITATION_STYLE_LABELS[selectedStyle].name} • ${SOURCE_TYPE_LABELS[srcType].th}):`,
                            `Key Verification Checkpoints (${CITATION_STYLE_LABELS[selectedStyle].name} • ${SOURCE_TYPE_LABELS[srcType].en}):`
                          )}
                        </span>
                      </div>
                      <ul className="space-y-1 text-xs text-amber-950 font-sarabun pl-5 list-disc">
                        {(t('th', 'en') === 'th'
                          ? sheet.verificationTipsTh
                          : sheet.verificationTipsEn
                        ).map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SECTION 3: Interactive Live Output Verifier (Compare User's Own Entries Against Cheat Sheet) */}
          <div className="bg-white rounded-3xl border-2 border-indigo-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shrink-0">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold font-sarabun">
                    {t(
                      'ระบบเทียบเคียงและตรวจสอบผลลัพธ์จากรายการบรรณานุกรมของคุณ (Verify Your Output Against Cheat Sheet)',
                      'Interactive Output Verifier: Compare Your Bibliography Entries Against Official Examples'
                    )}
                  </h3>
                  <p className="text-xs text-indigo-200 font-sarabun">
                    {t(
                      'เลือกรายการบรรณานุกรมในโปรเจกต์ของคุณด้านล่าง เพื่อตรวจเช็คการแสดงผลจริงเทียบกับต้นแบบจุดต่อจุด',
                      'Select any entry from your current project below to verify its formatted output and field completeness side-by-side.'
                    )}
                  </p>
                </div>
              </div>

              {/* Search & Entry Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-indigo-300 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('ค้นหารายการของคุณ...', 'Filter your entries...')}
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder:text-indigo-200/70 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <select
                  value={activeUserEntry?.id || ''}
                  onChange={(e) => setSelectedUserEntryId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold border border-slate-200 max-w-xs truncate cursor-pointer"
                >
                  {(matchingUserEntries.length > 0 ? matchingUserEntries : entries).map(
                    (entry, idx) => (
                      <option key={entry.id} value={entry.id}>
                        [{SOURCE_TYPE_LABELS[entry.sourceType].en}] {idx + 1}. {entry.title}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            {activeUserEntry ? (
              <div className="p-5 space-y-5">
                {(() => {
                  const formattedUser = formatCitation(activeUserEntry, selectedStyle, 1);
                  const templateSheet = buildCheatSheetItem(
                    selectedStyle,
                    activeUserEntry.sourceType
                  );
                  const checklist = evaluateUserEntryChecklist(activeUserEntry);
                  const passedCount = checklist.filter((c) => c.passed).length;

                  return (
                    <>
                      {/* Side-by-Side Comparison Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Left: Official Template Reference */}
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-800 text-white font-sarabun">
                              {t(
                                `ต้นแบบมาตรฐาน (${CITATION_STYLE_LABELS[selectedStyle].name} • ${SOURCE_TYPE_LABELS[activeUserEntry.sourceType].th})`,
                                `Official Standard Example (${CITATION_STYLE_LABELS[selectedStyle].name} • ${SOURCE_TYPE_LABELS[activeUserEntry.sourceType].en})`
                              )}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500">
                              {activeUserEntry.language === 'th'
                                ? t('เกณฑ์ภาษาไทย', 'Thai Format')
                                : t('เกณฑ์ภาษาอังกฤษ', 'English Format')}
                            </span>
                          </div>
                          <div className="bg-white rounded-xl border border-slate-200 p-3.5 text-sm leading-relaxed text-slate-900 font-sarabun">
                            <div
                              className={
                                selectedStyle === 'vancouver' ? '' : 'pl-8 -indent-8'
                              }
                            >
                              {templateSheet.tokens
                                .filter((tk) =>
                                  activeUserEntry.language === 'th' ? tk.sampleTh : tk.sampleEn
                                )
                                .map((tk, i) => (
                                  <span key={i} className={tk.italic ? 'italic' : ''}>
                                    {activeUserEntry.language === 'th'
                                      ? tk.sampleTh
                                      : tk.sampleEn}
                                    {tk.punctuationAfter || ''}
                                  </span>
                                ))}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 font-sarabun">
                            <span className="font-bold">
                              {t('อ้างอิงในเนื้อหาต้นแบบ:', 'Standard In-Text:')}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold">
                              {activeUserEntry.language === 'th'
                                ? templateSheet.inTextParentheticalTh
                                : templateSheet.inTextParentheticalEn}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold">
                              {activeUserEntry.language === 'th'
                                ? templateSheet.inTextNarrativeTh
                                : templateSheet.inTextNarrativeEn}
                            </span>
                          </div>
                        </div>

                        {/* Right: User's Actual Formatted Output */}
                        <div className="rounded-2xl border-2 border-indigo-300 bg-indigo-50/40 p-4 space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-600 text-white font-sarabun">
                              {t(
                                'ผลลัพธ์รายการของคุณ (Your Live Formatted Output)',
                                'Your Live Formatted Entry Output'
                              )}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyText(
                                    formattedUser.plainText,
                                    `user-${activeUserEntry.id}`
                                  )
                                }
                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                {copiedId === `user-${activeUserEntry.id}` ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>{t('คัดลอกแล้ว', 'Copied')}</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>{t('คัดลอก', 'Copy')}</span>
                                  </>
                                )}
                              </button>
                              {onEditEntry && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    onEditEntry(activeUserEntry);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>{t('แก้ไขรายการนี้', 'Edit Entry')}</span>
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="bg-white rounded-xl border border-indigo-200 p-3.5 text-sm leading-relaxed text-slate-900 font-sarabun shadow-2xs">
                            <div
                              className={
                                selectedStyle === 'vancouver' ? '' : 'pl-8 -indent-8'
                              }
                            >
                              {formattedUser.spans.map((sp, i) => (
                                <span
                                  key={i}
                                  className={`${sp.italic ? 'italic text-indigo-950 font-medium' : ''} ${
                                    sp.bold ? 'font-bold' : ''
                                  }`}
                                >
                                  {sp.text}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-indigo-950 font-sarabun">
                            <span className="font-bold">
                              {t('อ้างอิงในเนื้อหาของคุณ:', 'Your In-Text Citation:')}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white border border-indigo-200 font-semibold">
                              {formattedUser.inTextParenthetical}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white border border-indigo-200 font-semibold">
                              {formattedUser.inTextNarrative}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Field-by-Field Verification Checklist */}
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-slate-800 font-sarabun">
                              {t(
                                'ผลการตรวจเช็คองค์ประกอบจุดต่อจุด (Element-by-Element Verification):',
                                'Element-by-Element Verification Status:'
                              )}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                passedCount === checklist.length
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {passedCount}/{checklist.length}{' '}
                              {t('องค์ประกอบครบถ้วน', 'Elements Verified')}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {checklist.map((item, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-xl border text-xs font-sarabun flex items-start gap-2.5 ${
                                item.passed
                                  ? 'bg-white border-emerald-200'
                                  : 'bg-rose-50/70 border-rose-300'
                              }`}
                            >
                              {item.passed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-slate-900">
                                  {t(item.labelTh, item.labelEn)}
                                </div>
                                <div
                                  className={`truncate font-medium mt-0.5 ${
                                    item.passed ? 'text-indigo-700' : 'text-rose-700 font-bold'
                                  }`}
                                  title={item.value}
                                >
                                  {item.value}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  {t(item.hintTh, item.hintEn)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 font-sarabun">
                {t(
                  'ยังไม่มีรายการบรรณานุกรมในชุดปัจจุบันสำหรับใช้เปรียบเทียบ',
                  'No bibliography entries in the current project to compare yet.'
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-7 py-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-sarabun">
            {t(
              '💡 เคล็ดลับ: คุณสามารถสลับดูรูปแบบ APA 7th, MLA 9th, Chicago, Harvard และ Vancouver เพื่อเปรียบเทียบความแตกต่างของเครื่องหมายวรรคตอนและตัวเอียงได้ทันที',
              '💡 Tip: Switch between APA 7th, MLA 9th, Chicago, Harvard, and Vancouver above to inspect how punctuation and italics change for each source type.'
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedStyle !== currentStyle && (
              <button
                type="button"
                onClick={() => {
                  onChangeStyle(selectedStyle);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {t(
                  `ใช้รูปแบบ ${CITATION_STYLE_LABELS[selectedStyle].name} และปิดหน้าต่าง`,
                  `Apply ${CITATION_STYLE_LABELS[selectedStyle].name} & Close`
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {t('ปิดหน้าต่าง', 'Close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
