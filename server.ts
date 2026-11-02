import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import nodemailer from 'nodemailer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Google Search Grounding for Academic Citations and Bibliography
app.post('/api/citation/search-grounding', async (req, res) => {
  const cleanQuery = (req.body?.query || '').trim();
  if (!cleanQuery) {
    return res.status(400).json({
      success: false,
      error: 'กรุณาระบุคำค้นหา (ชื่อบทความ หนังสือ ผู้แต่ง หรือหัวข้อวิจัย)',
    });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error:
          'ไม่พบ GEMINI_API_KEY ในระบบ กรุณาตรวจสอบการตั้งค่าคีย์ใน Settings > Secrets',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemPrompt = `You are a high-accuracy academic research librarian and citation metadata specialist.
The user is searching for real bibliographic citations for:
"${cleanQuery}"

TASK:
1. Use Google Search grounding to find authentic, verifiable bibliographic metadata for books, peer-reviewed journal articles, dissertations/theses, conference papers, or official academic web sources matching the search.
2. Extract complete citation details (Title, Authors with First & Last names, Year, Publisher/Journal Name, Volume, Issue, Pages, City/Place, DOI, ISBN, URL, and Institution for theses).
3. If Thai names are present, recognize Thai naming conventions (Firstname Lastname, Buddhist Era B.E. or C.E.).
4. Return up to 5 best matching results in strict JSON format.

JSON RESPONSE FORMAT:
\`\`\`json
{
  "query": "${cleanQuery}",
  "results": [
    {
      "sourceType": "book" | "journal" | "website" | "thesis" | "conference",
      "language": "th" | "en",
      "title": "Exact title of the work",
      "authors": [
        {
          "firstName": "Given name or Thai first name",
          "lastName": "Family name or Thai last name",
          "isOrganization": false,
          "isThai": true
        }
      ],
      "year": "2023 or 2566",
      "yearType": "CE" | "BE",
      "containerTitle": "Journal name, book title, or website name",
      "volume": "Volume number (e.g. 12)",
      "issue": "Issue number (e.g. 2)",
      "pages": "Page range (e.g. 45-62)",
      "publisher": "Publisher or press name",
      "place": "City, Country (e.g. กรุงเทพฯ, หรือ New York, NY)",
      "institution": "University/Institution name for thesis",
      "degreeType": "วิทยานิพนธ์ปริญญาดุษฎีนิพนธ์ / วิทยานิพนธ์ปริญญามหาบัณฑิต / Doctoral dissertation",
      "doi": "DOI without url prefix (e.g. 10.1016/...)",
      "isbn": "ISBN number if available",
      "url": "Official or publisher link",
      "snippet": "Short summary context in Thai (1-2 sentences)",
      "confidence": "high" | "medium"
    }
  ]
}
\`\`\`
Return ONLY the JSON fence. Do not include introductory conversational text.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: systemPrompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const responseText = response.text || '';

    // Extract grounding chunks and web search queries
    const groundingChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSearchQueries =
      response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];

    // Parse JSON from model output
    let parsedData: any = null;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        parsedData = JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.warn('Failed to parse regex json fence:', e);
      }
    }

    if (!parsedData) {
      try {
        parsedData = JSON.parse(responseText.trim());
      } catch (e) {
        const firstBrace = responseText.indexOf('{');
        const lastBrace = responseText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          try {
            parsedData = JSON.parse(
              responseText.substring(firstBrace, lastBrace + 1)
            );
          } catch (e2) {
            console.error('Fallback parse failed:', e2);
          }
        }
      }
    }

    const items =
      parsedData?.results || (Array.isArray(parsedData) ? parsedData : []);

    const formattedSources = groundingChunks
      .filter((c: any) => c.web?.uri)
      .map((c: any) => ({
        title: c.web?.title || 'แหล่งอ้างอิงจากเว็บ',
        url: c.web?.uri || '',
      }));

    return res.json({
      success: true,
      query: cleanQuery,
      items,
      sources: formattedSources,
      webSearchQueries,
    });
  } catch (error: any) {
    console.error('Search grounding error, initiating academic fallback:', error?.message || error);

    // Fallback: If quota exceeded or error occurred, use CrossRef & Google Books academic search
    try {
      const fallback = await fallbackSearchCitations(cleanQuery);
      if (fallback.results && fallback.results.length > 0) {
        return res.json({
          success: true,
          query: cleanQuery,
          items: fallback.results,
          sources: fallback.sources,
          webSearchQueries: [cleanQuery],
          isFallback: true,
          notice:
            'ระบบดึงข้อมูลจากฐานข้อมูลวิชาการ CrossRef & Library ให้โดยตรง (เนื่องจากโควต้า Gemini พักการทำงานชั่วคราว)',
        });
      }
    } catch (fallbackErr) {
      console.error('Fallback search also failed:', fallbackErr);
    }

    // Return friendly error
    let userMsg =
      error?.message ||
      'เกิดข้อผิดพลาดในการค้นหาผ่าน Google Search Grounding กรุณาลองใหม่อีกครั้ง';
    if (typeof userMsg === 'string' && (userMsg.includes('429') || userMsg.includes('RESOURCE_EXHAUSTED'))) {
      userMsg =
        'โควต้าการใช้งาน Gemini ชั่วคราวเต็ม (Rate Limit 429) กรุณารอสักครู่แล้วค้นหาใหม่อีกครั้ง หรือตั้งค่า API Key ใน Settings > Secrets';
    }

    return res.status(500).json({
      success: false,
      error: userMsg,
    });
  }
});

// Fallback search using CrossRef & Google Books public APIs
async function fallbackSearchCitations(query: string) {
  const results: any[] = [];
  const sources: any[] = [];

  try {
    const crUrl = `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(
      query
    )}&rows=4`;
    const crRes = await fetch(crUrl, {
      headers: {
        'User-Agent': 'AutoBiblioApp/1.0 (mailto:academic-tools@example.com)',
      },
    });

    if (crRes.ok) {
      const crData: any = await crRes.json();
      const crItems = crData.message?.items || [];
      for (const item of crItems) {
        const title = item.title?.[0] || 'ไม่มีชื่อเรื่อง';
        const authors = (item.author || []).map((a: any) => ({
          firstName: a.given || a.name || '',
          lastName: a.family || '',
          isOrganization: !a.family && !!a.name,
          isThai: /[\u0E00-\u0E7F]/.test(`${a.given || ''} ${a.family || ''}`),
        }));
        const year =
          item['published-print']?.['date-parts']?.[0]?.[0] ||
          item['published-online']?.['date-parts']?.[0]?.[0] ||
          item.issued?.['date-parts']?.[0]?.[0] ||
          '';

        const isJournal = item.type === 'journal-article';
        results.push({
          sourceType: isJournal ? 'journal' : 'book',
          language: /[\u0E00-\u0E7F]/.test(title) ? 'th' : 'en',
          title,
          authors:
            authors.length > 0
              ? authors
              : [
                  {
                    firstName: 'Unknown Author',
                    lastName: '',
                    isOrganization: false,
                    isThai: false,
                  },
                ],
          year: year ? String(year) : '',
          yearType: 'CE',
          containerTitle: item['container-title']?.[0] || undefined,
          volume: item.volume || undefined,
          issue: item.issue || undefined,
          pages: item.page || undefined,
          publisher: item.publisher || undefined,
          doi: item.DOI || undefined,
          isbn: item.ISBN?.[0] || undefined,
          url:
            item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : undefined),
          confidence: 'high',
        });

        if (item.URL) {
          sources.push({
            title: `${title} (CrossRef Academic Record)`,
            url: item.URL,
          });
        }
      }
    }
  } catch (e) {
    console.warn('CrossRef search error:', e);
  }

  // If few results, query Google Books
  if (results.length < 3) {
    try {
      const gbUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        query
      )}&maxResults=3`;
      const gbRes = await fetch(gbUrl);
      if (gbRes.ok) {
        const gbData: any = await gbRes.json();
        for (const item of gbData.items || []) {
          const vi = item.volumeInfo || {};
          const title = vi.title || '';
          const authors = (vi.authors || []).map((name: string) => {
            const parts = name.trim().split(/\s+/);
            const isThai = /[\u0E00-\u0E7F]/.test(name);
            return {
              firstName: isThai ? name : parts.slice(0, -1).join(' ') || parts[0],
              lastName: isThai ? '' : parts.length > 1 ? parts[parts.length - 1] : '',
              isOrganization: false,
              isThai,
            };
          });

          const year = vi.publishedDate ? vi.publishedDate.split('-')[0] : '';
          const isbns = vi.industryIdentifiers || [];
          const isbnObj =
            isbns.find((id: any) => id.type === 'ISBN_13') || isbns[0];

          results.push({
            sourceType: 'book',
            language: /[\u0E00-\u0E7F]/.test(title) ? 'th' : 'en',
            title,
            authors:
              authors.length > 0
                ? authors
                : [
                    {
                      firstName: 'ไม่ระบุผู้แต่ง',
                      lastName: '',
                      isOrganization: false,
                      isThai: false,
                    },
                  ],
            year,
            yearType: 'CE',
            publisher: vi.publisher || undefined,
            isbn: isbnObj?.identifier || undefined,
            pages: vi.pageCount ? String(vi.pageCount) : undefined,
            url: vi.infoLink || undefined,
            snippet: vi.description
              ? vi.description.substring(0, 150) + '...'
              : undefined,
            confidence: 'high',
          });

          if (vi.infoLink) {
            sources.push({
              title: `${title} (Google Books Library)`,
              url: vi.infoLink,
            });
          }
        }
      }
    } catch (e) {
      console.warn('Google Books search error:', e);
    }
  }

  return { results, sources };
}

// Endpoint to send formatted bibliography directly to the registered user's email
app.post('/api/bibliography/send-email', async (req, res) => {
  const {
    recipientEmail,
    projectTitle,
    citationStyle,
    itemsCount,
    formattedText,
    formattedHtml,
    docxBase64,
    docxFilename,
  } = req.body || {};

  if (!recipientEmail || typeof recipientEmail !== 'string' || !recipientEmail.includes('@')) {
    return res.status(400).json({
      success: false,
      error: 'กรุณาระบุอีเมลผู้รับที่ถูกต้อง',
    });
  }

  try {
    let transporter: any;
    let isTestAccount = false;

    // Check if custom SMTP is configured in environment
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Create a test account (built into nodemailer)
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      isTestAccount = true;
    }

    const title = projectTitle || 'ชุดบรรณานุกรมงานวิจัย';
    const styleLabel = citationStyle || 'มาตรฐานสากล';
    const count = itemsCount || 0;

    const emailSubject = `[AutoBiblio] เอกสารบรรณานุกรม: ${title} (${styleLabel})`;

    const emailHtml = `
      <div style="font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #2563eb;">
          <h1 style="color: #1e3a8a; font-size: 22px; margin-bottom: 6px;">ระบบจัดการบรรณานุกรมสำหรับงานวิจัยและวิทยานิพนธ์</h1>
          <p style="color: #64748b; font-size: 13px; margin: 0;">AutoBiblio Academic Citation System</p>
        </div>

        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin-top: 20px; border: 1px solid #cbd5e1;">
          <h2 style="color: #0f172a; font-size: 17px; margin-top: 0;">เรียน ผู้ใช้งาน (${recipientEmail})</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            ระบบได้จัดเตรียมและส่งมอบเอกสารรายการบรรณานุกรมสำหรับ <strong>"${title}"</strong> เรียบร้อยแล้ว ตามมาตรฐานการอ้างอิง <strong>${styleLabel}</strong>
          </p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
            <tr style="background-color: #f8fafc;">
              <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0; width: 35%;">ชื่อโครงงาน / วิทยานิพนธ์:</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${title}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0;">รูปแบบอ้างอิง (Style):</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;"><span style="background-color: #dbeafe; color: #1e40af; padding: 3px 8px; border-radius: 4px; font-weight: 600;">${styleLabel}</span></td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0;">จำนวนรายการอ้างอิง:</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${count} รายการ</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0;">วันที่จัดส่ง:</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}</td>
            </tr>
          </table>

          <h3 style="color: #1e293b; font-size: 15px; margin-top: 24px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">
            รายการบรรณานุกรม (${count} รายการ):
          </h3>

          <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; font-family: 'Times New Roman', 'Sarabun', serif; font-size: 14px; line-height: 1.8; color: #0f172a; border-left: 4px solid #2563eb; margin-top: 12px; white-space: pre-wrap;">
${formattedHtml || formattedText || 'ไม่มีรายการบรรณานุกรม'}
          </div>

          ${docxBase64 ? `
          <div style="margin-top: 20px; padding: 14px 16px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px;">
            <p style="margin: 0; font-size: 13.5px; color: #1e40af;">
              📎 <strong>แนบเอกสาร Word (.docx):</strong> ได้แนบไฟล์ <em>${docxFilename || 'Bibliography.docx'}</em> พร้อมฟอร์แมตระยะขอบและฟอนต์มาตรฐานมาด้วยในอีเมลฉบับนี้ สามารถเปิดใช้งานต่อได้ทันที
            </p>
          </div>
          ` : ''}
        </div>

        <div style="margin-top: 24px; text-align: center; font-size: 12px; color: #94a3b8;">
          <p style="margin: 4px 0;">อีเมลนี้ส่งอัตโนมัติจากระบบ AutoBiblio ระบบจัดการบรรณานุกรมสำหรับงานวิจัยและวิทยานิพนธ์</p>
          <p style="margin: 4px 0;">หากท่านมีข้อสงสัยหรือต้องการสอบถามเพิ่มเติม สามารถตอบกลับอีเมลนี้ได้</p>
        </div>
      </div>
    `;

    const attachments: any[] = [];
    if (docxBase64) {
      const buffer = Buffer.from(docxBase64, 'base64');
      attachments.push({
        filename: docxFilename || 'Bibliography.docx',
        content: buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
    }

    const info = await transporter.sendMail({
      from: '"AutoBiblio Research System" <noreply@autobiblio-academic.internal>',
      to: recipientEmail,
      subject: emailSubject,
      text: `รายการบรรณานุกรมสำหรับ: ${title}\nรูปแบบ: ${styleLabel}\nจำนวน: ${count} รายการ\n\n${formattedText}`,
      html: emailHtml,
      attachments,
    });

    const previewUrl = isTestAccount ? (nodemailer.getTestMessageUrl(info) as string) : null;

    return res.json({
      success: true,
      message: 'ส่งเอกสารบรรณานุกรมไปยังอีเมลผู้ใช้เรียบร้อยแล้ว',
      messageId: info.messageId,
      recipient: recipientEmail,
      previewUrl,
      isTestAccount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Send email error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'เกิดข้อผิดพลาดในการส่งอีเมล กรุณาลองใหม่อีกครั้ง',
    });
  }
});

// Configure Vite middleware in Dev vs Static in Prod
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
