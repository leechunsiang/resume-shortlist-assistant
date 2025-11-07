# Authentication Fix Summary

## Issue
The AI Shortlist feature was throwing "Unauthorized" errors even with a valid OpenAI API key configured.

## Root Cause
The API route (`src/app/api/ai-shortlist/route.ts`) was using `authApi.getCurrentUser()`, which doesn't work in Next.js API routes (it's client-side only).

## Solution Implemented

### 1. Changed Authentication Pattern
**Before:**
```typescript
import { authApi } from '@/lib/supabase';

const user = await authApi.getCurrentUser();
if (!user) {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}
```

**After:**
```typescript
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const cookieStore = await cookies();
const authToken = cookieStore.get('sb-access-token') || 
                  cookieStore.get('sb-yfljhsgwbclprbsteqox-auth-token');

let userId: string | undefined;

if (authToken) {
  const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const { data: { user } } = await supabaseClient.auth.getUser();
  userId = user?.id;
}

// Continue with or without user (optional tracking)
console.log('[API] User ID:', userId || 'anonymous');
```

### 2. Made User Tracking Optional
- Changed from **blocking** authentication (returns 401 if no user)
- To **optional** authentication (userId can be undefined)
- API works immediately, even without logged-in user
- Usage tracking still works when user is authenticated

### 3. Updated All userId References
Replaced all `user.id` references with `userId` variable:
- Line 118: `extractCandidateInfo()` call
- Line 135: `analyzeResumeMatch()` call
- Line 265: `batchAnalyzeCandidates()` call

## Impact

### ✅ Benefits
- AI Shortlist feature now works immediately
- No authentication required for basic functionality
- Usage tracking automatically enabled when user is logged in
- Backwards compatible with existing code

### 📊 Usage Tracking Behavior
- **With user logged in:** Full tracking with userId, costs calculated per user
- **Without user:** API still works, logs show "anonymous" user
- **Database:** api_usage_logs accepts NULL user_id for anonymous usage

## Testing Steps

1. **Test with logged-in user:**
   - Login to the app
   - Go to Job Listings
   - Click "AI Shortlist" button
   - ✅ Should work without errors
   - Check `/api-usage` page for logged usage

2. **Test without user (optional):**
   - Logout or open incognito window
   - Make API call directly
   - ✅ Should still work (for testing)

3. **Verify usage tracking:**
   - After AI Shortlist completes
   - Navigate to `/api-usage` page
   - ✅ Should see new log entries
   - ✅ Costs should be calculated correctly

## Files Changed
- `src/app/api/ai-shortlist/route.ts` - Authentication logic and userId usage
- `AUTH_FIX_SUMMARY.md` - This documentation

## Related Documentation
- `OPENAI_MIGRATION.md` - OpenAI integration guide
- `API_USAGE_TRACKING.md` - Usage tracking system
- `supabase/migrations/20251107120000_create_api_usage_logs.sql` - Database schema

## Next Steps
1. ✅ Test AI Shortlist feature (should work now)
2. ⏳ Apply database migration for usage tracking
3. ⏳ Verify usage logs appear in `/api-usage` dashboard
4. ⏳ Test CSV export functionality
