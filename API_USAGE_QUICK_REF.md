# API Usage Tracking - Quick Reference

## ✅ What's Implemented

**Comprehensive OpenAI API usage tracking system with per-user and per-organization analytics stored in Supabase.**

## 🚀 Quick Start

### 1. Apply Database Migration

Run in Supabase SQL Editor:
```sql
-- Copy and paste content from:
supabase/migrations/20251107120000_create_api_usage_logs.sql
```

### 2. View Usage Dashboard

Navigate to **API Usage** in the sidebar or visit: `/api-usage`

### 3. Export Data

Click "Export CSV" button on the API Usage page.

## 📊 What Gets Tracked

| Field | Description |
|-------|-------------|
| **User ID** | Who made the request |
| **Organization ID** | Which organization |
| **Endpoint** | `extract_candidate_info` or `analyze_resume_match` |
| **Model** | `gpt-4.1-nano` |
| **Input Tokens** | Tokens sent to AI |
| **Output Tokens** | Tokens received from AI |
| **Total Cost** | Calculated cost in USD |
| **Response Time** | How long the request took (ms) |
| **Success** | Whether the request succeeded |
| **Timestamp** | When the request was made |

## 💰 Pricing

**GPT-4.1-nano:**
- Input: $0.10 per 1M tokens
- Output: $0.40 per 1M tokens

Example cost per analysis: ~$0.001-0.002

## 📁 New Files Created

```
supabase/migrations/
  └── 20251107120000_create_api_usage_logs.sql  [Database schema]

src/lib/
  └── api-usage.ts                               [Usage tracking utilities]

src/app/
  └── api-usage/
      └── page.tsx                               [Usage dashboard]

docs/
  └── API_USAGE_TRACKING.md                      [Full documentation]
```

## 🔧 Modified Files

```
src/lib/gemini.ts                    [Added usage logging]
src/app/api/ai-shortlist/route.ts   [Pass user/org IDs]
src/components/dashboard-layout.tsx [Added API Usage link]
```

## 📈 Dashboard Features

### Stats Cards
- **Your Requests** - Total API calls you made
- **Your Tokens** - Total tokens you used
- **Your Cost** - Total cost of your API usage
- **Organization Cost** - Total cost for entire organization

### Recent API Calls Table
- Date and time
- Endpoint called
- Tokens used
- Cost
- Response time
- Success/failure status

### Endpoint Breakdown
- Visual chart showing usage by endpoint
- Request count per endpoint
- Cost distribution

### Time Filters
- Last 7 days
- Last 30 days
- Last 90 days

## 🔐 Security (RLS)

- Users can only see their own logs
- Admins/Owners can see organization-wide logs
- System can insert logs for all users

## 📤 Export Format

CSV includes:
```
Date, User ID, Endpoint, Model, Input Tokens, Output Tokens, 
Total Tokens, Total Cost (USD), Success, Response Time (ms)
```

## 🎯 Use Cases

### 1. Cost Monitoring
Track your OpenAI API spending across users and projects.

### 2. Usage Analytics
Identify which features use the most AI resources.

### 3. Budget Management
Set budgets per organization based on historical usage.

### 4. Performance Monitoring
Track response times to identify slow API calls.

### 5. Error Tracking
See which API calls are failing and why.

## 🧪 Testing

### Test It Works:

1. Upload a resume or run AI shortlist
2. Go to `/api-usage`
3. You should see:
   - Request count increased
   - Token usage tracked
   - Cost calculated
   - New entry in Recent API Calls table

### Verify in Supabase:

```sql
SELECT * FROM api_usage_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

## 📊 Query Examples

### Get Your Usage
```typescript
import { getUserUsageSummary } from '@/lib/api-usage';

const summary = await getUserUsageSummary(userId);
console.log(`Total cost: $${summary.totalCost}`);
console.log(`Total requests: ${summary.totalRequests}`);
```

### Get Organization Usage
```typescript
import { getOrganizationUsageSummary } from '@/lib/api-usage';

const summary = await getOrganizationUsageSummary(orgId);
console.log(`Org cost: $${summary.totalCost}`);
console.log(`By user:`, summary.byUser);
```

### Get Recent Logs
```typescript
import { getUserRecentLogs } from '@/lib/api-usage';

const logs = await getUserRecentLogs(userId, 50);
logs.forEach(log => {
  console.log(`${log.endpoint}: ${log.total_tokens} tokens, $${log.total_cost}`);
});
```

## 🎨 Helper Functions

```typescript
import { formatCost, formatTokens } from '@/lib/api-usage';

formatCost(0.001234);    // "$0.001234"
formatTokens(1500);      // "1.50K"
formatTokens(2500000);   // "2.50M"
```

## ⚠️ Important Notes

1. **Migration Required**: Run the SQL migration before using
2. **Automatic Tracking**: All AI calls are logged automatically
3. **No Extra Code**: Existing AI features work unchanged
4. **Real Costs**: Costs are calculated based on actual token usage

## 🎉 Benefits

✅ Track individual user costs
✅ Monitor organization spending
✅ Identify expensive operations
✅ Export data for accounting
✅ Performance insights
✅ Error tracking
✅ Fully automated

## 📞 Need Help?

Check the full documentation: `API_USAGE_TRACKING.md`

## 🔄 Next Steps

After migration:
1. ✅ Run the SQL migration
2. ✅ Test with an AI action
3. ✅ View the dashboard
4. ✅ Export data to verify

All done! 🎊
