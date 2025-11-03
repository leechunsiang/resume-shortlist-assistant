# Installation Guide

This guide provides step-by-step instructions for installing all dependencies for the Resume Shortlist Assistant project.

## Prerequisites

Before installing dependencies, ensure you have the following installed:

- **Node.js** (v18.17 or higher recommended)
- **npm** (v9 or higher) or **yarn** (v1.22 or higher)
- **Git** (for cloning the repository)

Check your versions:
```bash
node --version
npm --version
```

## Installation Steps

### 1. Clone the Repository (if not already done)

```bash
git clone <your-repository-url>
cd resume-shortlist-assistant
```

### 2. Install All Dependencies

Run one of the following commands in the project root:

```bash
npm install
```

Or using yarn:
```bash
yarn install
```

This will install all dependencies listed in `package.json`.

### 3. Verify Installation

After installation completes, verify that `node_modules` folder is created and contains all packages.

## Dependency Categories

### Core Framework
- **next** (v15.0.2) - React framework for production
- **react** (v18.3.1) - JavaScript library for building user interfaces
- **react-dom** (v18.3.1) - React package for working with the DOM

### Backend Services
- **@supabase/supabase-js** (v2.78.0) - Supabase client library
- **@supabase/auth-helpers-nextjs** (v0.10.0) - Authentication helpers for Next.js

### AI Integration
- **@google/generative-ai** (v0.24.1) - Google Gemini AI SDK

### PDF Processing
- **pdf-parse** (v2.4.5) - PDF text extraction
- **pdf2json** (v4.0.0) - Alternative PDF parser
- **jspdf** (v3.0.3) - PDF generation library
- **jspdf-autotable** (v5.0.2) - Table plugin for jsPDF

### Data Processing
- **papaparse** (v5.5.3) - CSV parser and writer

### UI Components
- **@radix-ui/react-avatar** (v1.1.10) - Accessible avatar component
- **@radix-ui/react-progress** (v1.1.7) - Progress bar component
- **@radix-ui/react-slot** (v1.2.3) - Component composition utility
- **lucide-react** (v0.552.0) - Icon library
- **framer-motion** (v12.23.24) - Animation library
- **liquid-glass-react** (v1.1.1) - Glass morphism effects

### Styling Utilities
- **tailwind-merge** (v3.3.1) - Merge Tailwind CSS classes
- **class-variance-authority** (v0.7.1) - Create variant-based components
- **clsx** (v2.1.1) - Utility for constructing className strings

### Development Dependencies
- **typescript** (v5) - TypeScript language
- **@types/node** (v20) - TypeScript definitions for Node.js
- **@types/react** (v18) - TypeScript definitions for React
- **@types/react-dom** (v18) - TypeScript definitions for React DOM
- **@types/papaparse** (v5.3.16) - TypeScript definitions for papaparse
- **tailwindcss** (v3.4.1) - Utility-first CSS framework
- **autoprefixer** (v10.4.21) - PostCSS plugin to parse CSS and add vendor prefixes
- **postcss** (v8) - Tool for transforming CSS
- **eslint** (v8) - JavaScript linter
- **eslint-config-next** (v15.0.2) - ESLint configuration for Next.js

## Troubleshooting

### Common Issues

#### Issue: `npm install` fails with permission errors
**Solution (Windows):** Run PowerShell as Administrator

#### Issue: Node version incompatibility
**Solution:** Update Node.js to v18.17 or higher
```bash
node --version
```

#### Issue: Package conflicts
**Solution:** Clear cache and reinstall
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

Or using PowerShell:
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

#### Issue: pdf-parse installation fails
**Solution:** This package requires build tools. On Windows, install:
```bash
npm install --global windows-build-tools
```

### Verifying Individual Packages

After installation, you can verify specific packages:

```bash
npm list <package-name>
```

Example:
```bash
npm list next
npm list @supabase/supabase-js
npm list @google/generative-ai
```

## Next Steps

After successfully installing dependencies:

1. **Configure Environment Variables** - See `requirements/ENVIRONMENT_SETUP.md`
2. **Setup Supabase** - See `SUPABASE_SETUP.md`
3. **Configure Google Gemini AI** - See `GEMINI_AI_SETUP.md`
4. **Run Development Server** - `npm run dev`

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [Google Gemini AI Documentation](https://ai.google.dev/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
