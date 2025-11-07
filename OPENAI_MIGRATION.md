# OpenAI GPT-4.1-nano Migration

## Overview
Successfully migrated AI integration from Google Gemini to OpenAI GPT-4.1-nano.

## Changes Made

### 1. Package Installation
- Installed `openai` npm package
- Previous: `@google/generative-ai`
- New: `openai`

### 2. Code Changes

#### File: `src/lib/gemini.ts`
**Note:** File kept as `gemini.ts` for backward compatibility, but now uses OpenAI.

**Changes:**
- Replaced Google Generative AI import with OpenAI
- Updated initialization from `GoogleGenerativeAI` to `OpenAI`
- Changed model from `gemini-2.5-flash-lite` to `gpt-4.1-nano`
- Updated API calls from `generateContent()` to `chat.completions.create()`
- Simplified JSON parsing (OpenAI supports `response_format: { type: 'json_object' }`)
- Removed complex markdown code block extraction logic
- Updated error messages to reference OpenAI instead of Gemini

**Key Implementation Details:**
```typescript
// Old (Gemini)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
const result = await model.generateContent(prompt);

// New (OpenAI)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
const completion = await openai.chat.completions.create({
  model: 'gpt-4.1-nano',
  messages: [{ role: 'user', content: prompt }],
  temperature: 0.3,
  response_format: { type: 'json_object' }
});
```

### 3. Environment Variables

#### File: `.env.local`
**Changed:**
```bash
# Old
GOOGLE_GEMINI_API_KEY=AIzaSyAhDpPRUgVmgv_aibkgGhVLrtgslYBp81E

# New
OPENAI_API_KEY=your_openai_api_key_here
```

**Action Required:** 
- Replace `your_openai_api_key_here` with your actual OpenAI API key
- Get your API key from: https://platform.openai.com/api-keys

## Benefits of OpenAI GPT-4.1-nano

1. **JSON Mode Support**: Native `response_format: { type: 'json_object' }` eliminates need for complex JSON extraction
2. **Reliable Format**: More consistent JSON responses without markdown code blocks
3. **Better Accuracy**: GPT-4.1-nano provides high-quality analysis with fast response times
4. **Cost-Effective**: Nano model is optimized for cost while maintaining quality

## Functions Updated

### 1. `extractCandidateInfo()`
- Extracts structured candidate information from resume text
- Uses GPT-4.1-nano with JSON mode
- Temperature: 0.3 (for consistent extraction)

### 2. `analyzeResumeMatch()`
- Analyzes candidate-job fit with scoring
- Provides strengths, weaknesses, and recommendations
- Uses GPT-4.1-nano with JSON mode
- Temperature: 0.3 (for consistent analysis)

### 3. `batchAnalyzeCandidates()`
- No changes needed (uses the above functions)
- Maintains 1-second delay between requests to avoid rate limiting

## Testing Checklist

- [ ] Update `.env.local` with valid OpenAI API key
- [ ] Restart development server
- [ ] Test resume upload and candidate extraction
- [ ] Test AI shortlisting on job listings
- [ ] Verify match scores and analysis quality
- [ ] Check error handling (invalid API key, network errors)
- [ ] Monitor API usage and costs

## API Key Setup

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key
4. Update `.env.local`:
   ```bash
   OPENAI_API_KEY=sk-proj-...your-key-here...
   ```
5. Restart your development server:
   ```bash
   npm run dev
   ```

## Cost Considerations

- GPT-4.1-nano is the most cost-effective GPT-4 model
- Pricing: ~$0.10 per 1M input tokens, ~$0.40 per 1M output tokens
- Average resume analysis: ~2,000-3,000 tokens per request
- Estimated cost: ~$0.001-0.002 per candidate analysis

## Rollback (if needed)

If you need to rollback to Gemini:

1. Reinstall Gemini package:
   ```bash
   npm install @google/generative-ai
   ```

2. Restore the original `gemini.ts` file from git:
   ```bash
   git checkout HEAD -- src/lib/gemini.ts
   ```

3. Update `.env.local` back to:
   ```bash
   GOOGLE_GEMINI_API_KEY=AIzaSyAhDpPRUgVmgv_aibkgGhVLrtgslYBp81E
   ```

## Notes

- The file `src/lib/gemini.ts` name was kept for backward compatibility
- Consider renaming to `src/lib/ai.ts` in future refactoring
- All AI functionality remains the same from the user's perspective
- Custom prompts (from Filters page) still work as expected
