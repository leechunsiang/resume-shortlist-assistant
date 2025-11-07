# API Usage Tracking Implementation

## Overview
Comprehensive OpenAI API usage tracking system that logs every API call per user and organization, storing data in Supabase for cost monitoring and analytics.

## Features

### ✅ Implemented

1. **Per-User Tracking**
   - Individual user API usage logs
   - Token consumption tracking
   - Cost calculation per request
   - Success/failure tracking

2. **Per-Organization Tracking**
   - Organization-wide usage analytics
   - Team member breakdown
   - Endpoint-based usage stats

3. **Database Storage**
   - All logs stored in Supabase
   - Efficient indexing for fast queries
   - Row-Level Security (RLS) policies

4. **Usage Dashboard**
   - Visual stats for requests, tokens, and costs
   - Recent API calls table
   - Endpoint breakdown charts
   - Time range filters (7/30/90 days)

5. **Cost Tracking**
   - Real-time cost calculation based on GPT-4.1-nano pricing
   - Input/output token costs
   - Total cost aggregation

6. **Export Functionality**
   - Export usage logs to CSV
   - Detailed log data for accounting

## Database Schema

### Table: `api_usage_logs`

```sql
CREATE TABLE api_usage_logs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    endpoint TEXT,  -- 'extract_candidate_info' or 'analyze_resume_match'
    model TEXT DEFAULT 'gpt-4.1-nano',
    input_tokens INTEGER,
    output_tokens INTEGER,
    total_tokens INTEGER,
    input_cost DECIMAL(10, 6),
    output_cost DECIMAL(10, 6),
    total_cost DECIMAL(10, 6),
    request_type TEXT,  -- 'single' or 'batch'
    candidate_id UUID REFERENCES candidates(id),
    job_id UUID REFERENCES job_listings(id),
    success BOOLEAN,
    error_message TEXT,
    response_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### View: `api_usage_analytics`

Aggregated daily usage statistics per user/organization/endpoint.

### Functions:

1. **`get_user_usage_summary(user_id, start_date, end_date)`**
   - Returns total requests, tokens, cost
   - Breakdown by endpoint

2. **`get_organization_usage_summary(org_id, start_date, end_date)`**
   - Organization-wide summary
   - Breakdown by user and endpoint

## Implementation Files

### 1. Database Migration
**File:** `supabase/migrations/20251107120000_create_api_usage_logs.sql`
- Creates `api_usage_logs` table
- Indexes for performance
- RLS policies
- Analytics view
- Summary functions

### 2. API Usage Library
**File:** `src/lib/api-usage.ts`

**Functions:**
- `calculateCost(model, inputTokens, outputTokens)` - Calculate costs
- `logApiUsage(log)` - Log usage to Supabase
- `getUserUsageSummary(userId, startDate, endDate)` - Get user summary
- `getOrganizationUsageSummary(orgId, startDate, endDate)` - Get org summary
- `getUserRecentLogs(userId, limit)` - Get recent logs
- `exportUsageLogsToCSV(logs)` - Export to CSV
- `formatCost(cost)` - Format as currency
- `formatTokens(tokens)` - Format token count

### 3. Updated AI Functions
**File:** `src/lib/gemini.ts`

**Changes:**
- Added `userId`, `organizationId` parameters to functions
- Track start time and token usage
- Log successful and failed API calls
- Calculate costs and response times

**Updated Functions:**
- `extractCandidateInfo()` - Now logs usage
- `analyzeResumeMatch()` - Now logs usage
- `batchAnalyzeCandidates()` - Passes tracking params

### 4. Updated API Route
**File:** `src/app/api/ai-shortlist/route.ts`

**Changes:**
- Get authenticated user
- Pass `userId` and `organizationId` to AI functions
- Automatic usage logging for all API calls

### 5. Usage Dashboard
**File:** `src/app/api-usage/page.tsx`

**Features:**
- Personal vs organization stats
- Request count, token usage, costs
- Recent API calls table
- Endpoint breakdown
- Time range filters
- CSV export

### 6. Sidebar Navigation
**File:** `src/components/dashboard-layout.tsx`

**Changes:**
- Added "API Usage" link with Activity icon
- Positioned between "Filters" and "Settings"

## Pricing Configuration

**GPT-4.1-nano:**
- Input: $0.10 per 1M tokens
- Output: $0.40 per 1M tokens

Prices stored in `src/lib/api-usage.ts` and can be updated as needed.

## Usage Examples

### View API Usage
1. Navigate to `/api-usage` in the sidebar
2. Select time range (7/30/90 days)
3. View stats:
   - Your requests and costs
   - Organization total costs
   - Recent API calls
   - Endpoint breakdown

### Export Usage Data
1. Go to API Usage page
2. Click "Export CSV" button
3. CSV file downloads with all log data

### Query Usage Programmatically

```typescript
import { getUserUsageSummary, getOrganizationUsageSummary } from '@/lib/api-usage';

// Get user summary for last 30 days
const userSummary = await getUserUsageSummary(userId);

// Get organization summary with custom date range
const startDate = new Date('2024-10-01');
const endDate = new Date('2024-10-31');
const orgSummary = await getOrganizationUsageSummary(orgId, startDate, endDate);
```

## How It Works

### 1. API Call Flow

```
User triggers AI action
  ↓
API route receives request
  ↓
Get authenticated user ID
  ↓
Call AI function with userId & organizationId
  ↓
AI function makes OpenAI API call
  ↓
Track tokens, time, success/failure
  ↓
Calculate costs
  ↓
Log to Supabase api_usage_logs table
  ↓
Return result to user
```

### 2. Cost Calculation

```typescript
inputCost = (inputTokens / 1_000_000) × $0.10
outputCost = (outputTokens / 1_000_000) × $0.40
totalCost = inputCost + outputCost
```

### 3. Data Retention

- All logs stored permanently
- Indexed by user, organization, date
- Fast queries with PostgreSQL indexes
- RLS ensures data privacy

## Security & Privacy

### Row-Level Security (RLS)

1. **Users can view their own logs**
   ```sql
   POLICY "Users can view own API usage logs"
     FOR SELECT
     USING (user_id = auth.uid())
   ```

2. **Admins/Owners can view organization logs**
   ```sql
   POLICY "Admins can view organization logs"
     FOR SELECT
     USING (organization_id IN (
       SELECT organization_id 
       FROM organization_members 
       WHERE user_id = auth.uid()
       AND role IN ('owner', 'admin')
     ))
   ```

3. **System can insert logs**
   ```sql
   POLICY "Service role can insert API usage logs"
     FOR INSERT
     WITH CHECK (true)
   ```

## Monitoring & Alerts

### Cost Monitoring
Track total costs per organization to set budgets:

```typescript
const summary = await getOrganizationUsageSummary(orgId);
if (summary.totalCost > MONTHLY_BUDGET) {
  // Send alert to organization owner
}
```

### Usage Patterns
Identify high-usage users or endpoints:

```sql
SELECT user_id, COUNT(*), SUM(total_cost)
FROM api_usage_logs
WHERE organization_id = 'org-id'
GROUP BY user_id
ORDER BY SUM(total_cost) DESC;
```

## Testing

### Apply Migration

```bash
# Run the migration in Supabase SQL Editor
cat supabase/migrations/20251107120000_create_api_usage_logs.sql
```

### Test Usage Tracking

1. Upload a resume or run AI shortlist
2. Check `api_usage_logs` table in Supabase
3. Verify data:
   - `user_id` populated
   - `organization_id` populated
   - `input_tokens`, `output_tokens` > 0
   - `total_cost` calculated
   - `success = true`

3. Visit `/api-usage` page
4. Verify stats display correctly

## Future Enhancements

- [ ] Usage alerts (email/webhook when threshold reached)
- [ ] Budget limits per organization
- [ ] Rate limiting based on usage
- [ ] More detailed analytics charts
- [ ] Monthly usage reports
- [ ] Cost prediction based on trends
- [ ] API usage dashboard for admins

## API Endpoints

### Get User Summary
```typescript
const { data } = await supabase
  .rpc('get_user_usage_summary', {
    p_user_id: userId,
    p_start_date: startDate,
    p_end_date: endDate
  });
```

### Get Organization Summary
```typescript
const { data } = await supabase
  .rpc('get_organization_usage_summary', {
    p_organization_id: orgId,
    p_start_date: startDate,
    p_end_date: endDate
  });
```

## Troubleshooting

### No logs appearing

1. Check if user is authenticated
2. Verify `userId` and `organizationId` passed to AI functions
3. Check Supabase logs for errors
4. Verify RLS policies allow insert

### Incorrect costs

1. Check pricing in `src/lib/api-usage.ts`
2. Verify OpenAI returns token usage
3. Check calculation in `calculateCost()`

### RLS errors

1. Ensure user is authenticated
2. Check organization membership
3. Verify RLS policies in Supabase

## Summary

✅ **Complete API usage tracking system**
✅ **Per-user and per-organization analytics**
✅ **Cost tracking with GPT-4.1-nano pricing**
✅ **Visual dashboard with export**
✅ **Secure with Row-Level Security**
✅ **Scalable with indexed queries**

All OpenAI API calls are now automatically logged with detailed usage and cost data!
