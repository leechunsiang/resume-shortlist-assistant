# Pending Membership Activation

## Overview
When an admin/owner adds a member to their organization, the new member is added with a `pending` status. When that user signs up or logs in, their membership is automatically activated.

## How It Works

### 1. Adding a Member
When an admin/owner adds a member via email in Settings > Team:
- A record is created in `organization_members` table
- Status is set to `'pending'`
- `user_id` is empty (since the user might not have an account yet)
- `user_email` contains the invited email address

### 2. Automatic Activation
When a user signs up or logs in:
- The system checks for any pending memberships matching their email
- If found, those memberships are updated:
  - `user_id` is set to their actual user ID
  - `status` is changed from `'pending'` to `'active'`
  - `joined_at` timestamp is set

### 3. Organization Display
- The Settings page only shows organizations where the user has an `'active'` membership
- After activation, the new member will immediately see the organization in their settings

## Implementation

### Database Function
```typescript
// In src/lib/supabase.ts
organizationMembersApi.activatePendingMemberships(userId, userEmail)
```

This function:
- Finds all pending memberships for the given email
- Updates them to active status
- Sets the user_id and joined_at timestamp
- Returns the activated memberships

### Login Flow
```typescript
// In src/app/login/page.tsx
await organizationMembersApi.activatePendingMemberships(
  data.user.id,
  data.user.email || email
);
```

### Signup Flow
```typescript
// In src/app/signup/page.tsx
await organizationMembersApi.activatePendingMemberships(
  data.user.id,
  data.user.email || email
);
```

## User Experience

### Scenario 1: User Already Has Account
1. Admin adds `john@example.com` to organization
2. John logs in with his existing account
3. His pending membership is activated automatically
4. He immediately sees the new organization in Settings > Organization

### Scenario 2: New User Signs Up
1. Admin adds `jane@example.com` to organization
2. Jane signs up with `jane@example.com`
3. Her pending membership is activated during signup
4. She's redirected to organization setup but can see both organizations

### Scenario 3: Wrong Email
1. Admin adds `bob@work.com` to organization
2. Bob signs up with `bob@personal.com` (different email)
3. No activation occurs
4. Admin needs to invite the correct email

## Database Schema

```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID, -- Empty for pending invites
  user_email TEXT NOT NULL, -- Used for matching
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'inactive')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ, -- Set when activated
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Edge Cases Handled

1. **Multiple Pending Invites**: If a user is invited to multiple organizations, all are activated at once
2. **Case Sensitivity**: Email matching is case-insensitive (emails stored as lowercase)
3. **Already Active**: Won't affect memberships that are already active
4. **No Pending Invites**: Activation fails gracefully if no pending invites exist

## Testing

### Test Activation on Login
1. Have an admin add a member by email
2. Log in with that email
3. Navigate to Settings > Organization
4. Verify the organization appears in the list

### Test Activation on Signup
1. Have an admin add a member by email (use an email that doesn't have an account)
2. Sign up with that email
3. Complete organization setup (or skip)
4. Navigate to Settings > Organization
5. Verify the organization appears in the list

## Security Considerations

- Only the email match is used for activation (not username or other fields)
- User must authenticate successfully before activation
- No sensitive data is exposed during activation
- Activation is automatic and cannot be triggered manually by users
