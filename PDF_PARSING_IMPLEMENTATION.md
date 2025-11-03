# PDF Parsing Implementation

## Overview
The system now supports automatic PDF text extraction using the `pdf-parse` library, enabling seamless processing of PDF resumes.

## Architecture

### Client-Side (Browser)
**File: `src/app/job-listings/page.tsx`**

When users upload files:
1. **TXT files**: Read directly as text using `FileReader.readAsText()`
2. **PDF files**: Read as base64 data URL using `FileReader.readAsDataURL()`
3. Files are sent to backend with type information (`pdf` or `txt`)

```typescript
// Upload structure
{
  fileName: "john-doe-resume.pdf",
  text: "data:application/pdf;base64,JVBERi0xLjQK...",
  type: "pdf"  // or "txt"
}
```

### Server-Side (API Route)
**File: `src/app/api/ai-shortlist/route.ts`**

PDF processing flow:
1. Receives resume with type information
2. Detects PDF files by checking:
   - `type === 'pdf'`
   - Text starts with `data:application/pdf;base64,`
3. Calls `extractTextFromBase64PDF()` to parse PDF
4. Extracts clean text content
5. Proceeds with AI analysis using extracted text

```typescript
if (resume.type === 'pdf' && resumeText.startsWith('data:application/pdf;base64,')) {
  resumeText = await extractTextFromBase64PDF(resumeText);
}
```

### PDF Parser Library
**File: `src/lib/pdf-parser.ts`**

Utility functions for PDF text extraction:

```typescript
// Extract from base64 string
extractTextFromBase64PDF(base64: string): Promise<string>

// Extract from Buffer
extractTextFromPDF(buffer: Buffer): Promise<string>
```

**Process:**
1. Remove data URL prefix (`data:application/pdf;base64,`)
2. Convert base64 string to Buffer
3. Use pdf-parse library to extract text
4. Return clean text content

## Error Handling

### PDF Parsing Failures
If PDF extraction fails:
- Error is logged to console
- User-friendly error message returned
- Recommendation to convert to TXT format
- Other resumes in batch continue processing

### Data Sanitization
After extraction, all text is sanitized:
- NULL bytes (`\0`) removed
- Control characters stripped
- Unicode escape sequences handled
- Type conversions for database compatibility

## Benefits

### For Users
✅ Upload PDF resumes directly (no conversion needed)
✅ Multi-page PDF support
✅ Standard PDF format compatibility
✅ Batch upload multiple PDFs

### For Developers
✅ Reliable text extraction
✅ Error handling with fallbacks
✅ Base64 encoding for JSON transport
✅ Server-side processing (no browser limitations)

## Limitations

### PDF Complexity
- **Scanned PDFs**: Not supported (requires OCR)
- **Image-based PDFs**: Text must be selectable
- **Complex layouts**: May affect text ordering
- **Encrypted PDFs**: Password-protected files not supported

### Workarounds
If PDF parsing fails:
1. Convert to TXT format (see `HOW_TO_PREPARE_RESUMES.md`)
2. Copy text from PDF and paste into TXT file
3. Use online PDF-to-Text converters
4. Save from PDF viewer as plain text

## Testing

### Test Cases
1. **Simple single-page PDF**: ✅ Should extract correctly
2. **Multi-page PDF**: ✅ Should concatenate all pages
3. **PDF with images**: ⚠️ Images ignored, text extracted
4. **Scanned PDF**: ❌ Returns empty or garbage
5. **TXT file**: ✅ Direct processing (no PDF parsing needed)

### Validation
- Check extracted text length (should be > 100 characters)
- Verify name/email/phone extracted by AI
- Confirm candidate record created in database
- Review match scores and analysis quality

## Dependencies

```json
{
  "pdf-parse": "^1.1.1"
}
```

**Installation:**
```bash
npm install pdf-parse
```

## Future Enhancements

### Potential Improvements
- [ ] OCR support for scanned PDFs (using Tesseract.js)
- [ ] Better layout preservation (columns, tables)
- [ ] Encrypted PDF support (with password prompt)
- [ ] PDF metadata extraction (creation date, author)
- [ ] Image extraction from resumes
- [ ] File size validation (warn for >10MB files)
- [ ] Progress indicator for large PDFs

### Alternative Libraries
- **pdfjs-dist**: Mozilla's PDF.js (more features, larger bundle)
- **pdf2json**: JSON structure output
- **pdf-lib**: PDF creation and modification
- **tesseract.js**: OCR for scanned documents

## Troubleshooting

### Common Issues

**Problem:** "Failed to extract text from PDF"
- **Cause:** Corrupted or unsupported PDF format
- **Solution:** Try converting to TXT format

**Problem:** Empty text extraction
- **Cause:** Scanned PDF (image-based)
- **Solution:** Use OCR tool or retype content

**Problem:** Garbled text output
- **Cause:** Non-standard encoding or fonts
- **Solution:** Re-save PDF with standard fonts

**Problem:** Missing sections of text
- **Cause:** Complex multi-column layout
- **Solution:** Text may be out of order but still usable

## Code References

### Key Files
- `src/lib/pdf-parser.ts` - PDF extraction utilities
- `src/app/api/ai-shortlist/route.ts` - Server-side processing
- `src/app/job-listings/page.tsx` - Client-side upload handling
- `src/lib/gemini.ts` - AI analysis (uses extracted text)

### Related Documentation
- `AI_SHORTLIST_FEATURE.md` - Feature overview
- `HOW_TO_PREPARE_RESUMES.md` - User guide for file preparation
- `README.md` - Project setup and usage

---

**Implementation Date:** January 2025
**Status:** ✅ Production Ready
