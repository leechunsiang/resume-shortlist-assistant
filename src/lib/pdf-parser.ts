/**
 * Extract text from PDF using pdf2json library
 */
export async function extractTextFromPDFWithPdf2Json(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // @ts-ignore - pdf2json doesn't have proper type definitions
      const PDFParser = require('pdf2json');
      const pdfParser = new PDFParser();
      
      let textContent = '';
      
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        try {
          // Extract text from all pages
          const pages = pdfData.Pages || [];
          const allText: string[] = [];
          
          pages.forEach((page: any) => {
            const texts = page.Texts || [];
            const pageText = texts
              .map((text: any) => {
                return decodeURIComponent(text.R[0]?.T || '');
              })
              .join(' ');
            allText.push(pageText);
          });
          
          textContent = allText.join('\n\n');
          resolve(textContent);
        } catch (err) {
          reject(new Error('Failed to parse PDF data structure'));
        }
      });
      
      pdfParser.on('pdfParser_dataError', (error: any) => {
        reject(new Error(`PDF parsing error: ${error.parserError}`));
      });
      
      // Parse the buffer
      pdfParser.parseBuffer(buffer);
    } catch (error) {
      console.error('Error initializing pdf2json:', error);
      reject(new Error('Failed to initialize PDF parser'));
    }
  });
}

/**
 * Extract text from PDF buffer with fallback strategy
 * Tries pdf-parse first, then falls back to pdf2json
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Try pdf-parse first (modern library)
    const { PDFParse } = await import('pdf-parse');
    
    // Convert Buffer to Uint8Array for pdf-parse
    const uint8Array = new Uint8Array(buffer);
    
    // Initialize parser with the PDF data
    const parser = new PDFParse({ data: uint8Array });
    
    // Extract text from all pages
    const result = await parser.getText();
    
    // Return concatenated text from all pages
    return result.text;
  } catch (error) {
    console.log('pdf-parse failed, trying pdf2json fallback...', error);
    
    // Fallback to pdf2json
    try {
      return await extractTextFromPDFWithPdf2Json(buffer);
    } catch (fallbackError) {
      console.error('Both PDF parsers failed:', fallbackError);
      throw new Error('Failed to extract text from PDF with both parsers');
    }
  }
}

/**
 * Extract text from base64 PDF string
 */
export async function extractTextFromBase64PDF(base64: string): Promise<string> {
  try {
    // Remove data URL prefix if present
    const base64Data = base64.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    return await extractTextFromPDF(buffer);
  } catch (error) {
    console.error('Error parsing base64 PDF:', error);
    throw new Error('Failed to extract text from base64 PDF');
  }
}
