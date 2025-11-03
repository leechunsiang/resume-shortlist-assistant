# Authentication Setup

## Overview
The application now has a complete authentication system integrated with Supabase Auth.

## Features

### Login Page (`/login`)
- Email and password authentication
- "Remember me" checkbox
- Social login buttons (Google, GitHub) - UI ready, needs OAuth setup
- Link to signup page
- Redirects to dashboard after successful login

### Signup Page (`/signup`)
- User registration with email and password
- Full name field
- Password confirmation
- Password validation (minimum 6 characters)
- Terms and conditions checkbox
- Social signup buttons (Google, GitHub) - UI ready, needs OAuth setup
- Link to login page
- Success message and auto-redirect to login

### Protected Routes
The following routes are protected and require authentication:
- `/` (Dashboard)
- `/candidates`
- `/job-listings`

If a user tries to access these without being logged in, they will be redirected to `/login`.

### Logout
A logout button is available in the sidebar that:
- Signs the user out
- Redirects to the login page

## Supabase Configuration

### Enable Email Auth
1. Go to your Supabase project dashboard
2. Navigate to Authentication > Providers
3. Ensure "Email" is enabled

### (Optional) Enable OAuth Providers
To enable Google and GitHub login:

1. **Google OAuth:**
   - Go to Authentication > Providers > Google
   - Follow the instructions to set up Google OAuth
   - Add your OAuth credentials

2. **GitHub OAuth:**
   - Go to Authentication > Providers > GitHub
   - Follow the instructions to set up GitHub OAuth
   - Add your OAuth credentials

### Email Templates
You can customize email templates in:
- Authentication > Email Templates

## Testing

### Create a Test Account
1. Navigate to `http://localhost:3000/signup`
2. Fill in the form with test credentials
3. Click "Create Account"
4. You'll be redirected to the login page
5. Login with your credentials

### Test Protected Routes
1. Try accessing `http://localhost:3000` without logging in
2. You should be redirected to `/login`
3. After logging in, you'll be redirected back to the dashboard

### Test Logout
1. Click the "Logout" button in the sidebar
2. You should be signed out and redirected to login

## Authentication API

The `authApi` in `src/lib/supabase.ts` provides:

```typescript
authApi.getCurrentUser()      // Get current user
authApi.getSession()          // Get current session
authApi.signOut()             // Sign out user
authApi.isAuthenticated()     // Check if user is logged in
authApi.onAuthStateChange()   // Listen to auth state changes
```

## Middleware

The middleware (`src/middleware.ts`) automatically:
- Protects routes that require authentication
- Redirects unauthenticated users to login
- Redirects authenticated users away from login/signup pages
- Preserves the original URL for redirect after login

## Next Steps

1. **Email Verification**: Enable email verification in Supabase settings
2. **Password Reset**: Create a forgot password page
3. **OAuth Setup**: Configure Google and GitHub OAuth providers
4. **User Profile**: Create a user profile page
5. **Role-based Access**: Add role-based permissions if needed
