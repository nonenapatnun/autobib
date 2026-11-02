import { BibliographyEntry } from '../types/bibliography';

export const INITIAL_ENTRIES: BibliographyEntry[] = [
  {
    id: 'entry-1',
    sourceType: 'book',
    language: 'th',
    title: 'การวิจัยทางพฤติกรรมศาสตร์และสังคมศาสตร์',
    authors: [
      {
        id: 'a1',
        firstName: 'บุญชม',
        lastName: 'ศรีสะอาด',
        isOrganization: false,
        isThai: true
      }
    ],
    year: '2553',
    yearType: 'BE',
    edition: '8',
    publisher: 'สุวีริยาสาส์น',
    place: 'กรุงเทพฯ',
    isbn: '9789745348882',
    createdAt: Date.now() - 500000,
    updatedAt: Date.now() - 500000
  },
  {
    id: 'entry-2',
    sourceType: 'journal',
    language: 'th',
    title: 'การพัฒนาทักษะการคิดเชิงวิเคราะห์ของนักเรียนระดับมัธยมศึกษาด้วยการจัดการเรียนรู้แบบสืบเสาะหาความรู้',
    authors: [
      {
        id: 'a2',
        firstName: 'สมหมาย',
        lastName: 'มั่นคง',
        isOrganization: false,
        isThai: true
      },
      {
        id: 'a3',
        firstName: 'กานดา',
        lastName: 'สมบัติ',
        isOrganization: false,
        isThai: true
      }
    ],
    year: '2565',
    yearType: 'BE',
    containerTitle: 'วารสารศึกษาศาสตร์ มหาวิทยาลัยนเรศวร',
    volume: '24',
    issue: '2',
    pages: '112-125',
    doi: '10.14456/edunuj.2022.9',
    createdAt: Date.now() - 400000,
    updatedAt: Date.now() - 400000
  },
  {
    id: 'entry-3',
    sourceType: 'journal',
    language: 'en',
    title: 'Deep residual learning for image recognition',
    authors: [
      { id: 'a4', firstName: 'Kaiming', lastName: 'He', isThai: false },
      { id: 'a5', firstName: 'Xiangyu', lastName: 'Zhang', isThai: false },
      { id: 'a6', firstName: 'Shaoqing', lastName: 'Ren', isThai: false },
      { id: 'a7', firstName: 'Jian', lastName: 'Sun', isThai: false }
    ],
    year: '2016',
    yearType: 'CE',
    containerTitle: 'Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition',
    volume: '39',
    issue: '3',
    pages: '770-778',
    doi: '10.1109/CVPR.2016.90',
    createdAt: Date.now() - 300000,
    updatedAt: Date.now() - 300000
  },
  {
    id: 'entry-4',
    sourceType: 'book',
    language: 'en',
    title: 'Research design: Qualitative, quantitative, and mixed methods approaches',
    authors: [
      { id: 'a8', firstName: 'John W.', lastName: 'Creswell', isThai: false },
      { id: 'a9', firstName: 'J. David', lastName: 'Creswell', isThai: false }
    ],
    year: '2018',
    yearType: 'CE',
    edition: '5th',
    publisher: 'SAGE Publications',
    place: 'Thousand Oaks, CA',
    isbn: '9781506386706',
    createdAt: Date.now() - 200000,
    updatedAt: Date.now() - 200000
  },
  {
    id: 'entry-5',
    sourceType: 'website',
    language: 'th',
    title: 'หลักเกณฑ์การทับศัพท์ภาษาอังกฤษและแนวทางการเขียนอ้างอิง',
    authors: [
      {
        id: 'a10',
        firstName: 'สำนักงานราชบัณฑิตยสภา',
        lastName: '',
        isOrganization: true,
        isThai: true
      }
    ],
    year: '2566',
    yearType: 'BE',
    monthDay: '15 มีนาคม',
    containerTitle: 'ราชบัณฑิตยสภาออนไลน์',
    url: 'https://www.orst.go.th/citation-guidelines',
    accessDate: '1 พฤศจิกายน 2569',
    createdAt: Date.now() - 100000,
    updatedAt: Date.now() - 100000
  }
];
