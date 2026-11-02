import { saveAs } from 'file-saver';

export type ManualLanguageEdition = 'bilingual' | 'th' | 'en';

export interface ManualSectionBlock {
  badge: string;
  title: string;
  subtitle?: string;
  accentColor: string; // Hex color e.g. '#4f46e5'
  bgLightColor: string; // Hex color e.g. '#eef2ff'
  items: {
    step?: string;
    heading: string;
    body: string;
  }[];
  callout?: {
    title: string;
    text: string;
  };
}

export interface ManualPageData {
  langTag: 'TH' | 'EN';
  headerTitle: string;
  headerSubtitle: string;
  pageCategory: string;
  isCoverHeader?: boolean;
  sections: ManualSectionBlock[];
}

export const THAI_MANUAL_PAGES: ManualPageData[] = [
  {
    langTag: 'TH',
    headerTitle: 'คู่มือการใช้งานระบบจัดการบรรณานุกรมสำหรับงานวิจัยและวิทยานิพนธ์',
    headerSubtitle: 'AutoBiblio • คู่มือปฏิบัติการฉบับสมบูรณ์ (Thai Official User Manual)',
    pageCategory: 'ส่วนที่ 1: การเริ่มต้นใช้งาน และการดึงข้อมูลอัตโนมัติ',
    isCoverHeader: true,
    sections: [
      {
        badge: 'บทที่ 1',
        title: 'ภาพรวมระบบ การเข้าสู่ระบบ และการบันทึกฐานข้อมูลคลาวด์ (Cloud Auto-Save)',
        subtitle: 'รองรับการทำงานต่อเนื่องทุกอุปกรณ์ พร้อมเมนูสลับภาษา ไทย (TH) / อังกฤษ (EN)',
        accentColor: '#4f46e5',
        bgLightColor: '#eef2ff',
        items: [
          {
            step: '1.1',
            heading: 'การเข้าสู่ระบบและสิทธิ์ผู้ใช้งาน (Authentication & Roles)',
            body: 'รองรับการเข้าสู่ระบบผ่านบัญชี Google (1-Click Sign-In), อีเมลและรหัสผ่าน หรือโหมดผู้เยี่ยมชม (Guest Mode) โดยระบบจะซิงก์ข้อมูลเข้ากับฐานข้อมูล Cloud Firestore ทันที',
          },
          {
            step: '1.2',
            heading: 'ระบบบันทึกข้อมูลอัตโนมัติบนคลาวด์ (Real-Time Cloud Auto-Save)',
            body: 'ทุกครั้งที่มีการเพิ่ม แก้ไข หรือเปลี่ยนรูปแบบการอ้างอิง ระบบจะบันทึกลง Cloud Firestore และเครื่องคอมพิวเตอร์โดยอัตโนมัติภายใน 0.5 วินาที สังเกตสถานะ "บันทึกอัตโนมัติแล้ว" ที่แถบด้านบน',
          },
          {
            step: '1.3',
            heading: 'การสลับภาษาเมนู ไทย / อังกฤษ (TH ไทย | EN Eng Switcher)',
            body: 'คลิกปุ่มสลับภาษา "TH ไทย | EN Eng" บนแถบเมนูด้านบนขวา เพื่อเปลี่ยนภาษาของปุ่มคำสั่ง หน้าต่างแจ้งเตือน และคู่มือการใช้งานได้ทันทีโดยข้อมูลไม่สูญหาย',
          },
        ],
      },
      {
        badge: 'บทที่ 2',
        title: 'การค้นหาและเพิ่มรายการบรรณานุกรมอัตโนมัติ 5 ช่องทาง',
        subtitle: 'ลดเวลาการพิมพ์เอง ป้องกันการสะกดผิด ด้วยระบบดึงข้อมูลจากฐานข้อมูลวิชาการระดับโลก',
        accentColor: '#0284c7',
        bgLightColor: '#f0f9ff',
        items: [
          {
            step: '2.1',
            heading: 'ค้นหาผ่าน Google Search Grounding (แนะนำ)',
            body: 'คลิกปุ่ม "Google Search" เพื่อค้นหาชื่อบทความ ชื่อหนังสือ หรือหัวข้องานวิจัยทั้งภาษาไทยและสากล ระบบจะค้นหาและดึงข้อมูลผู้แต่ง ปีพิมพ์ ชื่อวารสาร และ URL พร้อมแปลงเป็นบรรณานุกรมให้อัตโนมัติ',
          },
          {
            step: '2.2',
            heading: 'ดึงข้อมูลอัตโนมัติด้วยรหัส DOI / ISBN / URL เว็บไซต์',
            body: 'วางรหัส DOI (เช่น 10.1038/...), รหัสหนังสือ ISBN (10 หรือ 13 หลัก) หรือลิงก์ URL ในช่องค้นหาอัจฉริยะ ระบบจะเชื่อมต่อ Crossref, OpenLibrary และ Google Books เพื่อกรอกข้อมูลให้ครบทุกช่อง',
          },
          {
            step: '2.3',
            heading: 'การนำเข้าข้อมูลแบบกลุ่ม (Batch Import) และการกรอกด้วยตนเอง',
            body: 'คลิก "นำเข้าหลายรายการ" เพื่อวางรายการ DOI/ISBN/URL หลายบรรทัดพร้อมกัน หรือคลิก "+ เพิ่มรายการ" เพื่อกรอกและแก้ไขรายละเอียดด้วยตนเองพร้อมดูตัวอย่างการแสดงผลแบบเรียลไทม์',
          },
        ],
        callout: {
          title: 'เคล็ดลับสำหรับนักวิจัย (Pro Tip)',
          text: 'เมื่อเพิ่มรายการภาษาไทย ให้ระบุปีพิมพ์เป็น พ.ศ. (เช่น 2567) และรายการภาษาอังกฤษระบุเป็น ค.ศ. (เช่น 2024) ระบบจะจัดเรียงลำดับบรรณานุกรมภาษาไทยขึ้นก่อนภาษาอังกฤษตามเกณฑ์บัณฑิตวิทยาลัยให้อัตโนมัติ',
        },
      },
    ],
  },
  {
    langTag: 'TH',
    headerTitle: 'คู่มือการใช้งานระบบจัดการบรรณานุกรมสำหรับงานวิจัยและวิทยานิพนธ์',
    headerSubtitle: 'AutoBiblio • มาตรฐานการอ้างอิง และระบบสแกนตรวจสอบความสมบูรณ์อัตโนมัติ',
    pageCategory: 'ส่วนที่ 2: มาตรฐานการอ้างอิง 6 รูปแบบ และปุ่มแก้ไขอัตโนมัติ 3 ระดับ',
    sections: [
      {
        badge: 'บทที่ 3',
        title: 'มาตรฐานการอ้างอิงสากล 6 รูปแบบ และหลักเกณฑ์บรรณานุกรมภาษาไทย',
        subtitle: 'สลับรูปแบบการอ้างอิงได้ในคลิกเดียว ทั้งการอ้างอิงท้ายเล่ม และการอ้างอิงในเนื้อหา (In-Text Citation)',
        accentColor: '#7c3aed',
        bgLightColor: '#f5f3ff',
        items: [
          {
            step: '3.1',
            heading: 'APA 7th Edition และ APA 6th Edition (นิยมสูงสุดในไทย)',
            body: 'APA 7th รองรับการแสดงชื่อผู้แต่งสูงสุด 20 คน, ตัดคำว่า "Retrieved from" ออก และใช้ URL ของ DOI (https://doi.org/...) ส่วน APA 6th รองรับรูปแบบดั้งเดิมที่มหาวิทยาลัยบางแห่งยังกำหนดใช้',
          },
          {
            step: '3.2',
            heading: 'MLA 9th, Chicago 17th, Harvard และ Vancouver (ตัวเลขลำดับ)',
            body: 'รองรับสายมนุษยศาสตร์ (MLA/Chicago), สายบริหารธุรกิจ (Harvard) และสายวิทยาศาสตร์การแพทย์/วิศวกรรมศาสตร์ (Vancouver ระบบหมายเลข [1], [2] เรียงตามลำดับการอ้างอิง)',
          },
          {
            step: '3.3',
            heading: 'หลักเกณฑ์เฉพาะสำหรับบรรณานุกรมภาษาไทย (ราชบัณฑิตยสภา)',
            body: 'ระบบจัดการชื่อผู้แต่งชาวไทยโดยใช้ "ชื่อ ตามด้วย นามสกุล" (ไม่ต้องกลับนามสกุลขึ้นก่อน) และคัดกรองคำนำหน้านาม (นาย, นาง, นางสาว, ดร., ศ., รศ., ผศ.) พร้อมรองรับการระบุ ม.ป.ป. และ ม.ป.ท.',
          },
        ],
      },
      {
        badge: 'บทที่ 4',
        title: 'ระบบสแกนตรวจสอบความสมบูรณ์ (Validation Alert) & ปุ่มแก้ไขอัตโนมัติ 3 รูปแบบ',
        subtitle: 'ป้องกันบรรณานุกรมผิดพลาดหรือไม่น่าเชื่อถือ โดยไม่ต้องพิมพ์ข้อมูลที่ตกหล่นด้วยตนเอง',
        accentColor: '#059669',
        bgLightColor: '#ecfdf5',
        items: [
          {
            step: '4.1',
            heading: 'รูปแบบที่ 1: ปุ่ม "แก้ไขอัตโนมัติทั้งหมด" (Auto-Fix All Incomplete Entries)',
            body: 'แสดงบนแถบแจ้งเตือนสีเหลือง/แดง และในหน้าต่าง Validation Drawer เมื่อกดปุ่มนี้ ระบบจะค้นหาข้อมูลจริงจาก Crossref, OpenLibrary และ Google Search Grounding เพื่อเติมข้อมูลที่ขาดหายให้ครบทุกรายการในคลิกเดียว',
          },
          {
            step: '4.2',
            heading: 'รูปแบบที่ 2: ปุ่ม "ค้นหาและเติมข้อมูลจริงอัตโนมัติ" รายรายการ (Per-Entry Repair)',
            body: 'อยู่ในแต่ละรายการที่มีข้อมูลไม่ครบ (เช่น ขาดปีพิมพ์ ขาดเลขหน้า หรือขาดสำนักพิมพ์) เพื่อดึงเฉพาะรายการนั้นจากฐานข้อมูลวิชาการที่เชื่อถือได้โดยไม่ต้องเสี่ยงพิมพ์ผิด',
          },
          {
            step: '4.3',
            heading: 'รูปแบบที่ 3: ปุ่ม "เติมคำย่อมาตรฐานวิชาการในคลิกเดียว" (1-Click Academic Presets)',
            body: 'กรณีเอกสารต้นฉบับไม่มีปีพิมพ์หรือสำนักพิมพ์จริงๆ สามารถคลิกปุ่มเติมคำย่อที่ถูกต้องตามหลักเกณฑ์ทันที เช่น "ม.ป.ป." (ไม่ปรากฏปีพิมพ์), "n.d.", "ม.ป.ท." หรือใส่วันที่สืบค้นวันนี้ให้อัตโนมัติ',
          },
        ],
      },
    ],
  },
  {
    langTag: 'TH',
    headerTitle: 'คู่มือการใช้งานระบบจัดการบรรณานุกรมสำหรับงานวิจัยและวิทยานิพนธ์',
    headerSubtitle: 'AutoBiblio • การตรวจไฟล์ภายนอก การส่งออกไฟล์ Word (.docx) และการส่งอีเมล',
    pageCategory: 'ส่วนที่ 3: ตรวจสอบไฟล์ภายนอก ส่งออก Word (.docx) และคลังข้อมูลคลาวด์',
    sections: [
      {
        badge: 'บทที่ 5',
        title: 'ระบบตรวจสอบและนำเข้าบรรณานุกรมจากไฟล์ภายนอก (External File Inspector)',
        subtitle: 'รองรับไฟล์ .docx, .bib (BibTeX), .ris (EndNote/Zotero/Mendeley), .csv, .json และ .txt',
        accentColor: '#d97706',
        bgLightColor: '#fffbeb',
        items: [
          {
            step: '5.1',
            heading: 'การอัปโหลดและแยกแยะรายการบรรณานุกรมอัตโนมัติ',
            body: 'คลิกปุ่ม "ตรวจไฟล์ภายนอก" บนแถบเมนู จากนั้นลากไฟล์เอกสาร Word (.docx) หรือไฟล์ฐานข้อมูล (.bib, .ris, .csv, .txt) ลงในหน้าต่าง ระบบจะสกัดรายชื่อผู้แต่ง ปีพิมพ์ ชื่อเรื่อง และแหล่งที่มาให้อัตโนมัติ',
          },
          {
            step: '5.2',
            heading: 'การสแกนความสมบูรณ์และซ่อมแซมข้อมูลก่อนนำเข้า',
            body: 'ระบบจะแสดงผลการตรวจแยกเป็น "สมบูรณ์พร้อมใช้", "มีคำแนะนำ" และ "ข้อมูลสำคัญตกหล่น" คุณสามารถกดปุ่มแก้ไขอัตโนมัติภายในหน้าต่างตรวจไฟล์ ก่อนกด "นำเข้าสู่โปรเจกต์ปัจจุบัน"',
          },
        ],
      },
      {
        badge: 'บทที่ 6',
        title: 'การส่งออกเอกสาร Microsoft Word (.docx) การส่งอีเมล และการจัดการประวัติ',
        subtitle: 'จัดหน้ากระดาษ A4 ระยะเยื้องบรรทัดที่สอง (Hanging Indent 0.5 นิ้ว) และฟอนต์มาตรฐานราชการ/มหาวิทยาลัย',
        accentColor: '#2563eb',
        bgLightColor: '#eff6ff',
        items: [
          {
            step: '6.1',
            heading: 'การส่งออกไฟล์ Word (.docx) พร้อมใช้งานทันที',
            body: 'คลิกปุ่ม "ส่งออก Word" เลือกฟอนต์ (เช่น TH Sarabun New 16 pt, Cordia New หรือ Times New Roman 12 pt), ตั้งค่าระยะขอบกระดาษ A4 และระยะห่างบรรทัด ระบบจะสร้างไฟล์ .docx ที่มี Hanging Indent ถูกต้องสมบูรณ์',
          },
          {
            step: '6.2',
            heading: 'การส่งบรรณานุกรมเข้าสู่อีเมล (Send to Email) และคลังประวัติ (Cloud History)',
            body: 'คลิก "ส่งไปที่อีเมล" เพื่อส่งรายการบรรณานุกรมพร้อมไฟล์แนบ .docx ไปยังอีเมลของคุณหรืออาจารย์ที่ปรึกษา และใช้เมนู "ประวัติและคลัง" เพื่อสร้างชุดบรรณานุกรมแยกตามบทวิจัยหรือสำรองข้อมูล JSON',
          },
          {
            step: '6.3',
            heading: 'ระบบจัดการสมาชิกสำหรับผู้ดูแลระบบ (Admin Member Management)',
            body: 'ปุ่ม "จัดการสมาชิก" (อยู่ถัดจากป้ายฐานข้อมูลคลาวด์ Firestore) ช่วยให้ผู้ดูแลระบบตรวจสอบรายชื่อสมาชิก กำหนดสิทธิ์ Admin และระงับ/เปิดใช้งานบัญชีได้อย่างปลอดภัย',
          },
        ],
        callout: {
          title: 'ช่องทางติดต่อสอบถามและขอรับการสนับสนุน (Support & Contact)',
          text: 'หากพบปัญหาการใช้งานหรือต้องการสอบถามรายละเอียดเพิ่มเติม ติดต่อได้ที่อีเมล: nonenapatnunwipat@gmail.com',
        },
      },
    ],
  },
];

export const ENGLISH_MANUAL_PAGES: ManualPageData[] = [
  {
    langTag: 'EN',
    headerTitle: 'Academic Bibliography Management System — Official User Manual',
    headerSubtitle: 'AutoBiblio • Complete Guide for Research Papers, Theses & Dissertations',
    pageCategory: 'Part 1: Getting Started, Cloud Sync & Automated Citation Fetching',
    isCoverHeader: true,
    sections: [
      {
        badge: 'Chapter 1',
        title: 'System Overview, Authentication & Real-Time Cloud Firestore Auto-Save',
        subtitle: 'Seamless multi-device persistence with instant Thai (TH) / English (EN) interface switching',
        accentColor: '#4f46e5',
        bgLightColor: '#eef2ff',
        items: [
          {
            step: '1.1',
            heading: 'User Authentication & Account Security',
            body: 'Sign in effortlessly via Google Sign-In, Email & Password, or Guest Mode. All bibliography projects are automatically linked to your account and stored securely in Google Cloud Firestore.',
          },
          {
            step: '1.2',
            heading: 'Real-Time Cloud Auto-Save & Status Indicator',
            body: 'Every addition, edit, or citation style change is automatically synchronized to Cloud Firestore and local storage within 450ms. Monitor the live "Cloud Auto-Saved" badge in the top toolbar.',
          },
          {
            step: '1.3',
            heading: 'Bilingual Interface Switcher (TH ไทย | EN Eng)',
            body: 'Use the "TH ไทย | EN Eng" toggle in the top-right navigation bar to switch all menus, validation alerts, tooltips, and documentation between Thai and English instantaneously.',
          },
        ],
      },
      {
        badge: 'Chapter 2',
        title: '5 Automated Ways to Search, Fetch & Import Academic References',
        subtitle: 'Eliminate manual typing errors by pulling verified metadata from global scholarly registries',
        accentColor: '#0284c7',
        bgLightColor: '#f0f9ff',
        items: [
          {
            step: '2.1',
            heading: 'Google Search Grounding for Academic Literature (Recommended)',
            body: 'Click "Google Search" in the toolbar to search for journal articles, books, theses, or institutional reports by title, author, or topic. Verified metadata and source URLs are extracted automatically.',
          },
          {
            step: '2.2',
            heading: 'Instant Lookup via DOI, ISBN, or Website URL',
            body: 'Paste any DOI (e.g., 10.1038/...), 10/13-digit ISBN, or web article URL into the Auto-Fetch bar. The system queries Crossref, OpenLibrary, and Google Books to populate all required fields.',
          },
          {
            step: '2.3',
            heading: 'Batch Identifier Import & Interactive Manual Editor',
            body: 'Use "Batch Import" to process multiple DOIs, ISBNs, or URLs simultaneously, or click "+ Add Entry" to use the guided form with live formatted citation preview.',
          },
        ],
        callout: {
          title: 'Academic Sorting Rule (Thai & International Bilingual Sorting)',
          text: 'AutoBiblio automatically sorts Thai references (using Buddhist Era B.E. years) ahead of English/International references (using A.D. years) in strict alphabetical order per university thesis guidelines.',
        },
      },
    ],
  },
  {
    langTag: 'EN',
    headerTitle: 'Academic Bibliography Management System — Official User Manual',
    headerSubtitle: 'AutoBiblio • Citation Standards & 3-Tier Automated Validation Repair',
    pageCategory: 'Part 2: 6 Citation Styles & Validation / Auto-Fix Engine',
    sections: [
      {
        badge: 'Chapter 3',
        title: '6 International Citation Styles & Thai Royal Society Formatting Rules',
        subtitle: 'Switch styles with 1 click for both Reference Lists and In-Text Citations',
        accentColor: '#7c3aed',
        bgLightColor: '#f5f3ff',
        items: [
          {
            step: '3.1',
            heading: 'APA 7th Edition & APA 6th Edition',
            body: 'APA 7th supports up to 20 authors before ellipsis, native https://doi.org/ links, and streamlined web citations. APA 6th remains available for faculties requiring legacy formatting.',
          },
          {
            step: '3.2',
            heading: 'MLA 9th, Chicago 17th (Author-Date), Harvard & Vancouver',
            body: 'Full support for Humanities (MLA 9th / Chicago 17th), Business & Social Sciences (Harvard), and Medical / Engineering numbered brackets ([1], [2] in Vancouver format).',
          },
          {
            step: '3.3',
            heading: 'Thai Academic Bibliography Conventions',
            body: 'Automatically formats Thai authors as "First Name Last Name" without inversion, strips academic/honorific prefixes (e.g., Dr., Prof., Mr., Ms.), and supports Thai abbreviations (ม.ป.ป., ม.ป.ท.).',
          },
        ],
      },
      {
        badge: 'Chapter 4',
        title: 'Completeness Scanner (Validation Alert) & 3-Tier Auto-Fix System',
        subtitle: 'Detect missing fields and repair entries automatically without risky manual typing',
        accentColor: '#059669',
        bgLightColor: '#ecfdf5',
        items: [
          {
            step: '4.1',
            heading: 'Tier 1: "Auto-Fix All" Button (1-Click Bulk Database Repair)',
            body: 'Located in the Validation Banner and Auditor Drawer. Queries Crossref, OpenLibrary, Google Books, and Google Search Grounding to fill missing years, pages, publishers, and DOIs across all entries at once.',
          },
          {
            step: '4.2',
            heading: 'Tier 2: Per-Entry "Auto-Fetch & Repair" Button',
            body: 'Displayed on individual incomplete cards in the Bibliography List and Validation Banner. Repairs that specific citation using verified scholarly metadata.',
          },
          {
            step: '4.3',
            heading: 'Tier 3: 1-Click Standard Academic Field Presets',
            body: 'When a source genuinely lacks a publication year or publisher, click the 1-click preset pills to insert official academic markers ("n.d.", "ม.ป.ป.", "[S.l. : s.n.]", or today\'s access date) with zero typing.',
          },
        ],
      },
    ],
  },
  {
    langTag: 'EN',
    headerTitle: 'Academic Bibliography Management System — Official User Manual',
    headerSubtitle: 'AutoBiblio • External File Inspector, Word (.docx) Export & Cloud History',
    pageCategory: 'Part 3: External File Auditing, Word Export & Administration',
    sections: [
      {
        badge: 'Chapter 5',
        title: 'External File Bibliography Inspector (.docx, .bib, .ris, .csv, .json, .txt)',
        subtitle: 'Audit existing reference files, fix missing metadata, and import clean citations',
        accentColor: '#d97706',
        bgLightColor: '#fffbeb',
        items: [
          {
            step: '5.1',
            heading: 'Multi-Format File Parsing & Extraction',
            body: 'Click "Inspect External File" in the top toolbar and upload a Microsoft Word (.docx) reference list, BibTeX (.bib), RIS (.ris from EndNote/Zotero), CSV, JSON, or plain text (.txt) file.',
          },
          {
            step: '5.2',
            heading: 'Pre-Import Completeness Audit & Auto-Repair',
            body: 'Each extracted entry is scored as Valid, Warning, or Error under your chosen citation style. Run 1-click Auto-Fix directly inside the inspector modal before importing into your active project.',
          },
        ],
      },
      {
        badge: 'Chapter 6',
        title: 'Microsoft Word (.docx) Export, Email Delivery & Cloud Project History',
        subtitle: 'Publication-ready A4 layout with 0.5" hanging indents and customizable typography',
        accentColor: '#2563eb',
        bgLightColor: '#eff6ff',
        items: [
          {
            step: '6.1',
            heading: 'Custom Microsoft Word (.docx) Export',
            body: 'Click "Export Word" to configure font family (TH Sarabun New 16 pt, Times New Roman 12 pt, Arial, etc.), A4 page margins, and line spacing. Downloads a native .docx file with exact 0.5-inch hanging indents.',
          },
          {
            step: '6.2',
            heading: 'Direct Email Delivery & Multi-Project Cloud Library',
            body: 'Use "Send to Email" to email formatted references and a .docx attachment to yourself or your advisor. Open "History & Cloud" to manage multiple research projects or export/import JSON backups.',
          },
          {
            step: '6.3',
            heading: 'Admin Member Management Panel',
            body: 'Accessible via the "Members" button right next to the Cloud Firestore DB badge. Enables administrators to review registered users, grant/revoke Admin privileges, or suspend accounts.',
          },
        ],
        callout: {
          title: 'Technical Support & Inquiries',
          text: 'For further assistance, academic collaboration, or system inquiries, please contact: nonenapatnunwipat@gmail.com',
        },
      },
    ],
  },
];

/**
 * Helper to draw a rounded rectangle on a CanvasRenderingContext2D
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fillStyle?: string,
  strokeStyle?: string,
  lineWidth = 1
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

/**
 * Word-wraps text (supports both space-delimited English/Thai and long Thai phrases)
 * and returns an array of lines that fit within maxWidth.
 */
function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  const pushOrBreakWord = (word: string) => {
    if (ctx.measureText(word).width <= maxWidth) {
      return [word];
    }
    // Break long continuous token safely on grapheme/character boundaries
    // without splitting Thai combining vowel/tone marks from their base consonant
    const chars = Array.from(word);
    const subLines: string[] = [];
    let buf = '';
    for (const ch of chars) {
      const test = buf + ch;
      if (ctx.measureText(test).width > maxWidth && buf.length > 0) {
        subLines.push(buf);
        buf = ch;
      } else {
        buf = test;
      }
    }
    if (buf) subLines.push(buf);
    return subLines;
  };

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      const broken = pushOrBreakWord(word);
      for (let j = 0; j < broken.length - 1; j++) {
        lines.push(broken[j]);
      }
      currentLine = broken[broken.length - 1] || '';
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Renders a single ManualPageData onto a high-DPI A4 Canvas (1654 x 2339 px)
 * and returns a JPEG data URL.
 */
function renderManualPageToJpeg(
  page: ManualPageData,
  pageNumber: number,
  totalPages: number
): string {
  const W = 1654; // 200 DPI A4 width
  const H = 2339; // 200 DPI A4 height
  const PAD_X = 96;
  const CONTENT_W = W - PAD_X * 2;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // 1. White A4 Paper Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Top decorative accent bar
  const topGrad = ctx.createLinearGradient(0, 0, W, 0);
  topGrad.addColorStop(0, '#312e81');
  topGrad.addColorStop(0.5, '#4f46e5');
  topGrad.addColorStop(1, '#0284c7');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, W, 18);

  let cursorY = 58;

  // 2. Header Banner
  const headerH = page.isCoverHeader ? 215 : 175;
  const bannerGrad = ctx.createLinearGradient(PAD_X, cursorY, PAD_X + CONTENT_W, cursorY + headerH);
  bannerGrad.addColorStop(0, '#1e1b4b');
  bannerGrad.addColorStop(0.6, '#312e81');
  bannerGrad.addColorStop(1, '#1e293b');
  drawRoundedRect(ctx, PAD_X, cursorY, CONTENT_W, headerH, 24, undefined, '#3730a3', 2);
  ctx.fillStyle = bannerGrad;
  ctx.fill();

  // Language & Edition Pill inside Header
  const badgeText =
    page.langTag === 'TH'
      ? 'คู่มือการใช้งานอย่างเป็นทางการ • THAI EDITION'
      : 'OFFICIAL USER MANUAL • ENGLISH EDITION';
  ctx.font = 'bold 20px "Sarabun", "Inter", sans-serif';
  const badgeW = ctx.measureText(badgeText).width + 36;
  drawRoundedRect(
    ctx,
    PAD_X + 36,
    cursorY + 26,
    badgeW,
    36,
    18,
    'rgba(99, 102, 241, 0.35)',
    'rgba(165, 180, 252, 0.5)',
    1.5
  );
  ctx.fillStyle = '#e0e7ff';
  ctx.fillText(badgeText, PAD_X + 54, cursorY + 51);

  // Page Category Pill on Top Right of Header
  ctx.font = 'bold 20px "Sarabun", "Inter", sans-serif';
  const catW = ctx.measureText(page.pageCategory).width + 36;
  drawRoundedRect(
    ctx,
    PAD_X + CONTENT_W - catW - 36,
    cursorY + 26,
    catW,
    36,
    18,
    'rgba(16, 185, 129, 0.25)',
    'rgba(110, 231, 183, 0.5)',
    1.5
  );
  ctx.fillStyle = '#a7f3d0';
  ctx.fillText(page.pageCategory, PAD_X + CONTENT_W - catW - 18, cursorY + 51);

  // Main Header Title
  ctx.font = 'bold 36px "Sarabun", "Inter", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(page.headerTitle, PAD_X + 36, cursorY + 108);

  // Header Subtitle
  ctx.font = '500 23px "Sarabun", "Inter", sans-serif';
  ctx.fillStyle = '#c7d2fe';
  ctx.fillText(page.headerSubtitle, PAD_X + 36, cursorY + 148);

  if (page.isCoverHeader) {
    ctx.font = '500 20px "Sarabun", "Inter", sans-serif';
    ctx.fillStyle = '#93c5fd';
    const subInfo =
      page.langTag === 'TH'
        ? 'รองรับ 6 มาตรฐานสากล: APA 7th • APA 6th • MLA 9th • Chicago 17th • Harvard • Vancouver | บันทึกข้อมูลคลาวด์ Firestore อัตโนมัติ'
        : 'Supports 6 Citation Styles: APA 7th • APA 6th • MLA 9th • Chicago 17th • Harvard • Vancouver | Real-Time Cloud Firestore Sync';
    ctx.fillText(subInfo, PAD_X + 36, cursorY + 188);
  }

  cursorY += headerH + 34;

  // 3. Render Sections
  for (const section of page.sections) {
    // Section Header Bar
    const secHeaderH = section.subtitle ? 96 : 66;
    drawRoundedRect(
      ctx,
      PAD_X,
      cursorY,
      CONTENT_W,
      secHeaderH,
      18,
      section.bgLightColor,
      section.accentColor,
      2
    );

    // Left accent strip
    drawRoundedRect(ctx, PAD_X, cursorY, 14, secHeaderH, 7, section.accentColor);

    // Chapter Badge
    ctx.font = 'bold 21px "Sarabun", "Inter", sans-serif';
    const secBadgeW = ctx.measureText(section.badge).width + 32;
    drawRoundedRect(
      ctx,
      PAD_X + 32,
      cursorY + 16,
      secBadgeW,
      36,
      10,
      section.accentColor
    );
    ctx.fillStyle = '#ffffff';
    ctx.fillText(section.badge, PAD_X + 48, cursorY + 41);

    // Section Title
    ctx.font = 'bold 28px "Sarabun", "Inter", sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(section.title, PAD_X + 48 + secBadgeW, cursorY + 43);

    // Section Subtitle
    if (section.subtitle) {
      ctx.font = '500 21px "Sarabun", "Inter", sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText(section.subtitle, PAD_X + 32, cursorY + 78);
    }

    cursorY += secHeaderH + 20;

    // Section Items
    for (const item of section.items) {
      const cardPadX = 28;
      const stepBadgeW = 68;
      const textStartX = PAD_X + cardPadX + stepBadgeW + 18;
      const textMaxW = CONTENT_W - cardPadX * 2 - stepBadgeW - 18;

      ctx.font = 'bold 25px "Sarabun", "Inter", sans-serif';
      const headingLines = wrapCanvasText(ctx, item.heading, textMaxW);

      ctx.font = '400 23px "Sarabun", "Inter", sans-serif';
      const bodyLines = wrapCanvasText(ctx, item.body, textMaxW);

      const lineHHeading = 33;
      const lineHBody = 33;
      const cardH =
        24 +
        headingLines.length * lineHHeading +
        8 +
        bodyLines.length * lineHBody +
        22;

      drawRoundedRect(
        ctx,
        PAD_X,
        cursorY,
        CONTENT_W,
        cardH,
        16,
        '#f8fafc',
        '#e2e8f0',
        1.5
      );

      // Step pill
      if (item.step) {
        drawRoundedRect(
          ctx,
          PAD_X + cardPadX,
          cursorY + 22,
          stepBadgeW,
          38,
          10,
          section.bgLightColor,
          section.accentColor,
          1.5
        );
        ctx.font = 'bold 21px "Sarabun", "Inter", sans-serif';
        ctx.fillStyle = section.accentColor;
        const stepTextW = ctx.measureText(item.step).width;
        ctx.fillText(
          item.step,
          PAD_X + cardPadX + (stepBadgeW - stepTextW) / 2,
          cursorY + 48
        );
      }

      // Draw Heading lines
      let itemY = cursorY + 46;
      ctx.font = 'bold 25px "Sarabun", "Inter", sans-serif';
      ctx.fillStyle = '#0f172a';
      for (const hLine of headingLines) {
        ctx.fillText(hLine, textStartX, itemY);
        itemY += lineHHeading;
      }

      itemY += 4;
      // Draw Body lines
      ctx.font = '400 23px "Sarabun", "Inter", sans-serif';
      ctx.fillStyle = '#334155';
      for (const bLine of bodyLines) {
        ctx.fillText(bLine, textStartX, itemY);
        itemY += lineHBody;
      }

      cursorY += cardH + 16;
    }

    // Optional Callout Box
    if (section.callout) {
      const calloutMaxW = CONTENT_W - 64;
      ctx.font = '500 22px "Sarabun", "Inter", sans-serif';
      const calloutLines = wrapCanvasText(ctx, section.callout.text, calloutMaxW);
      const calloutH = 54 + calloutLines.length * 32 + 18;

      drawRoundedRect(
        ctx,
        PAD_X,
        cursorY,
        CONTENT_W,
        calloutH,
        16,
        '#f0fdf4',
        '#34d399',
        2
      );

      ctx.font = 'bold 23px "Sarabun", "Inter", sans-serif';
      ctx.fillStyle = '#065f46';
      ctx.fillText(`💡 ${section.callout.title}`, PAD_X + 32, cursorY + 38);

      let cY = cursorY + 72;
      ctx.font = '500 22px "Sarabun", "Inter", sans-serif';
      ctx.fillStyle = '#064e3b';
      for (const cLine of calloutLines) {
        ctx.fillText(cLine, PAD_X + 32, cY);
        cY += 32;
      }

      cursorY += calloutH + 22;
    }

    cursorY += 12;
  }

  // 4. Quick Reference Table on Page 2 (Citation Style Comparison) if space permits
  if (cursorY < H - 340 && (pageNumber === 2 || pageNumber === 5)) {
    const isTH = page.langTag === 'TH';
    const boxH = H - 150 - cursorY;
    if (boxH >= 170) {
      drawRoundedRect(
        ctx,
        PAD_X,
        cursorY,
        CONTENT_W,
        boxH,
        16,
        '#f8fafc',
        '#cbd5e1',
        1.5
      );
      ctx.font = 'bold 23px "Sarabun", "Inter", sans-serif';
      ctx.fillStyle = '#1e293b';
      ctx.fillText(
        isTH
          ? 'ตารางสรุปรูปแบบการอ้างอิงในเนื้อหา (In-Text Citation Quick Reference)'
          : 'Quick Reference: In-Text Citation Formats Across 6 Standards',
        PAD_X + 28,
        cursorY + 38
      );

      const rows = isTH
        ? [
            '• APA 7th / 6th: (สมชาย ใจดี, 2567, น. 15) หรือ (Smith & Johnson, 2024, p. 42)',
            '• MLA 9th: (สมชาย ใจดี 15) หรือ (Smith and Johnson 42) — ไม่ต้องคั่นด้วยเครื่องหมายจุลภาค',
            '• Chicago 17th / Harvard: (สมชาย ใจดี 2567, 15) / (Smith & Johnson 2024, p. 42)',
            '• Vancouver: อ้างอิงด้วยหมายเลขเรียงตามลำดับการปรากฏในเนื้อหา เช่น [1], [2], [3]',
          ]
        : [
            '• APA 7th / 6th: (Smith & Johnson, 2024, p. 42) | 3+ authors in APA 7th: (Smith et al., 2024)',
            '• MLA 9th: (Smith and Johnson 42) — Author and page number without comma or "p."',
            '• Chicago 17th / Harvard: (Smith and Johnson 2024, 42) / (Smith & Johnson, 2024: 42)',
            '• Vancouver: Sequential bracketed numbers in order of appearance, e.g., [1], [2–4]',
          ];

      let rY = cursorY + 74;
      ctx.font = '500 21px "Sarabun", "Inter", sans-serif';
      ctx.fillStyle = '#334155';
      for (const r of rows) {
        if (rY < cursorY + boxH - 16) {
          ctx.fillText(r, PAD_X + 28, rY);
          rY += 32;
        }
      }
    }
  }

  // 5. Footer Bar
  const footerY = H - 105;
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD_X, footerY);
  ctx.lineTo(W - PAD_X, footerY);
  ctx.stroke();

  ctx.font = '500 20px "Sarabun", "Inter", sans-serif';
  ctx.fillStyle = '#475569';
  const leftFooter =
    page.langTag === 'TH'
      ? 'ติดต่อสอบถามรายละเอียดเพิ่มเติมได้ที่: nonenapatnunwipat@gmail.com'
      : 'For inquiries & technical support, contact: nonenapatnunwipat@gmail.com';
  ctx.fillText(leftFooter, PAD_X, footerY + 42);

  const rightFooter =
    page.langTag === 'TH'
      ? `หน้า ${pageNumber} จาก ${totalPages} • AutoBiblio User Manual`
      : `Page ${pageNumber} of ${totalPages} • AutoBiblio User Manual`;
  ctx.font = 'bold 20px "Sarabun", "Inter", sans-serif';
  ctx.fillStyle = '#1e293b';
  const rfW = ctx.measureText(rightFooter).width;
  ctx.fillText(rightFooter, W - PAD_X - rfW, footerY + 42);

  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Converts a base64 DataURL into a Uint8Array of raw binary bytes
 */
function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Packs an array of JPEG page images (1654 x 2339 px) into a valid, standards-compliant
 * multi-page A4 PDF 1.4 binary file (Uint8Array).
 */
function buildPdfFromJpegPages(jpegDataUrls: string[]): Uint8Array {
  const pageWidthPt = 595.28; // Standard A4 width in PDF points
  const pageHeightPt = 841.89; // Standard A4 height in PDF points
  const imgWidthPx = 1654;
  const imgHeightPx = 2339;

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let byteOffset = 0;

  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    byteOffset += bytes.byteLength;
  };

  const pushString = (str: string) => {
    pushBytes(encoder.encode(str));
  };

  const numPages = jpegDataUrls.length;
  // Object numbering:
  // 1: Catalog
  // 2: Pages Tree
  // For each page i (0..numPages-1):
  //   pageObjId = 3 + i * 3
  //   contentObjId = 4 + i * 3
  //   imageObjId = 5 + i * 3
  const totalObjects = 2 + numPages * 3;
  const offsets: number[] = new Array(totalObjects + 1).fill(0);

  // PDF Header (with binary comment per PDF spec)
  pushString('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  // Object 1: Catalog
  offsets[1] = byteOffset;
  pushString('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Object 2: Pages
  const kidsRefs = jpegDataUrls
    .map((_, idx) => `${3 + idx * 3} 0 R`)
    .join(' ');
  offsets[2] = byteOffset;
  pushString(
    `2 0 obj\n<< /Type /Pages /Kids [ ${kidsRefs} ] /Count ${numPages} >>\nendobj\n`
  );

  // Each Page + Content Stream + Image XObject
  for (let i = 0; i < numPages; i++) {
    const pageObjId = 3 + i * 3;
    const contentObjId = 4 + i * 3;
    const imageObjId = 5 + i * 3;
    const imgName = `/Im${i + 1}`;
    const jpegBytes = dataUrlToUint8Array(jpegDataUrls[i]);

    // Page Object
    offsets[pageObjId] = byteOffset;
    pushString(
      `${pageObjId} 0 obj\n` +
        `<< /Type /Page /Parent 2 0 R ` +
        `/MediaBox [ 0 0 ${pageWidthPt.toFixed(2)} ${pageHeightPt.toFixed(2)} ] ` +
        `/Resources << /ProcSet [ /PDF /ImageC ] /XObject << ${imgName} ${imageObjId} 0 R >> >> ` +
        `/Contents ${contentObjId} 0 R >>\n` +
        `endobj\n`
    );

    // Content Stream (draws the image scaled to full A4 page)
    const contentStream = `q\n${pageWidthPt.toFixed(2)} 0 0 ${pageHeightPt.toFixed(2)} 0 0 cm\n${imgName} Do\nQ\n`;
    const contentBytes = encoder.encode(contentStream);
    offsets[contentObjId] = byteOffset;
    pushString(
      `${contentObjId} 0 obj\n<< /Length ${contentBytes.byteLength} >>\nstream\n`
    );
    pushBytes(contentBytes);
    pushString('\nendstream\nendobj\n');

    // Image XObject
    offsets[imageObjId] = byteOffset;
    pushString(
      `${imageObjId} 0 obj\n` +
        `<< /Type /XObject /Subtype /Image ` +
        `/Width ${imgWidthPx} /Height ${imgHeightPx} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 ` +
        `/Filter /DCTDecode /Length ${jpegBytes.byteLength} >>\n` +
        `stream\n`
    );
    pushBytes(jpegBytes);
    pushString('\nendstream\nendobj\n');
  }

  // Cross-reference table (xref)
  const xrefOffset = byteOffset;
  pushString(`xref\n0 ${totalObjects + 1}\n`);
  pushString('0000000000 65535 f \n');
  for (let objId = 1; objId <= totalObjects; objId++) {
    const padded = String(offsets[objId]).padStart(10, '0');
    pushString(`${padded} 00000 n \n`);
  }

  // Trailer
  pushString(
    `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  );

  // Merge all chunks into a single Uint8Array
  const finalBytes = new Uint8Array(byteOffset);
  let pos = 0;
  for (const chunk of chunks) {
    finalBytes.set(chunk, pos);
    pos += chunk.byteLength;
  }
  return finalBytes;
}

/**
 * Generates and downloads the User Manual PDF in the chosen language edition:
 * - 'bilingual': Complete Thai + English Manual (6 A4 Pages)
 * - 'th': Thai User Manual (3 A4 Pages)
 * - 'en': English User Manual (3 A4 Pages)
 */
export async function exportUserManualToPdf(
  edition: ManualLanguageEdition = 'bilingual'
): Promise<string> {
  // Ensure web fonts (Sarabun & Inter) are loaded before drawing on canvas
  if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
    try {
      await (document as any).fonts.ready;
    } catch {
      // Fallback if fonts API not supported
    }
  }

  let pagesToRender: ManualPageData[] = [];
  let filename = 'AutoBiblio_User_Manual_TH_EN.pdf';

  if (edition === 'th') {
    pagesToRender = THAI_MANUAL_PAGES;
    filename = 'คู่มือการใช้งานระบบจัดการบรรณานุกรม_AutoBiblio_TH.pdf';
  } else if (edition === 'en') {
    pagesToRender = ENGLISH_MANUAL_PAGES;
    filename = 'AutoBiblio_Academic_Bibliography_User_Manual_EN.pdf';
  } else {
    pagesToRender = [...THAI_MANUAL_PAGES, ...ENGLISH_MANUAL_PAGES];
    filename = 'คู่มือการใช้งานระบบจัดการบรรณานุกรม_User_Manual_TH_EN.pdf';
  }

  const totalPages = pagesToRender.length;
  const jpegPages: string[] = [];

  for (let i = 0; i < totalPages; i++) {
    const jpegUrl = renderManualPageToJpeg(pagesToRender[i], i + 1, totalPages);
    jpegPages.push(jpegUrl);
  }

  const pdfBytes = buildPdfFromJpegPages(jpegPages);
  const blob = new Blob([pdfBytes as unknown as BlobPart], {
    type: 'application/pdf',
  });
  saveAs(blob, filename);

  return filename;
}
