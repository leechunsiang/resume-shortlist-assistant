# Project Dependencies

Complete list of all dependencies used in the Resume Shortlist Assistant project with detailed descriptions and documentation links.

## Production Dependencies

### Core Framework (3 packages)

#### next (v15.0.2)
- **Purpose:** React framework for production-ready applications
- **Features:** Server-side rendering, API routes, file-based routing
- **Documentation:** https://nextjs.org/docs
- **License:** MIT

#### react (v18.3.1)
- **Purpose:** JavaScript library for building user interfaces
- **Features:** Component-based architecture, virtual DOM, hooks
- **Documentation:** https://react.dev/
- **License:** MIT

#### react-dom (v18.3.1)
- **Purpose:** React package for working with the DOM
- **Features:** Rendering React components to the browser
- **Documentation:** https://react.dev/reference/react-dom
- **License:** MIT

---

### Backend & Database (2 packages)

#### @supabase/supabase-js (v2.78.0)
- **Purpose:** Supabase client library for JavaScript
- **Features:** Database operations, authentication, real-time subscriptions, storage
- **Documentation:** https://supabase.io/docs/reference/javascript
- **License:** MIT

#### @supabase/auth-helpers-nextjs (v0.10.0)
- **Purpose:** Authentication helpers for Next.js with Supabase
- **Features:** Middleware integration, session management, SSR support
- **Documentation:** https://supabase.io/docs/guides/auth/auth-helpers/nextjs
- **License:** MIT

---

### AI Integration (1 package)

#### @google/generative-ai (v0.24.1)
- **Purpose:** Google Gemini AI SDK for JavaScript
- **Features:** Text generation, conversation, content analysis
- **Documentation:** https://ai.google.dev/docs
- **Use Case:** Resume analysis, candidate matching, AI shortlisting
- **License:** Apache-2.0

---

### PDF Processing (4 packages)

#### pdf-parse (v2.4.5)
- **Purpose:** Extract text content from PDF files
- **Features:** Pure JavaScript, no native dependencies
- **Documentation:** https://www.npmjs.com/package/pdf-parse
- **Use Case:** Reading resume PDFs
- **License:** MIT

#### pdf2json (v4.0.0)
- **Purpose:** Alternative PDF parser with more features
- **Features:** Text extraction, metadata parsing
- **Documentation:** https://www.npmjs.com/package/pdf2json
- **Use Case:** Backup PDF parser
- **License:** Apache-2.0

#### jspdf (v3.0.3)
- **Purpose:** Generate PDF documents in JavaScript
- **Features:** Client-side PDF generation
- **Documentation:** https://github.com/parallax/jsPDF
- **Use Case:** Export reports, candidate summaries
- **License:** MIT

#### jspdf-autotable (v5.0.2)
- **Purpose:** Table plugin for jsPDF
- **Features:** Automatic table generation with styling
- **Documentation:** https://github.com/simonbengtsson/jsPDF-AutoTable
- **Use Case:** Export candidate tables, reports
- **License:** MIT

---

### Data Processing (1 package)

#### papaparse (v5.5.3)
- **Purpose:** CSV parser and writer for JavaScript
- **Features:** Parse/unparse CSV, streaming support
- **Documentation:** https://www.papaparse.com/
- **Use Case:** Export candidate data, import bulk resumes
- **License:** MIT

---

### UI Components - Radix UI (3 packages)

#### @radix-ui/react-avatar (v1.1.10)
- **Purpose:** Accessible avatar component
- **Features:** Fallback support, customizable styling
- **Documentation:** https://www.radix-ui.com/docs/primitives/components/avatar
- **License:** MIT

#### @radix-ui/react-progress (v1.1.7)
- **Purpose:** Progress bar component
- **Features:** Accessible, customizable animations
- **Documentation:** https://www.radix-ui.com/docs/primitives/components/progress
- **Use Case:** AI analysis progress, upload progress
- **License:** MIT

#### @radix-ui/react-slot (v1.2.3)
- **Purpose:** Component composition utility
- **Features:** Merge props, forward refs
- **Documentation:** https://www.radix-ui.com/docs/primitives/utilities/slot
- **License:** MIT

---

### UI & Animation (3 packages)

#### lucide-react (v0.552.0)
- **Purpose:** Beautiful & consistent icon library
- **Features:** 1000+ icons, tree-shakeable, customizable
- **Documentation:** https://lucide.dev/
- **Use Case:** UI icons throughout the app
- **License:** ISC

#### framer-motion (v12.23.24)
- **Purpose:** Production-ready motion library for React
- **Features:** Animations, gestures, transitions
- **Documentation:** https://www.framer.com/motion/
- **Use Case:** Page transitions, interactive animations
- **License:** MIT

#### liquid-glass-react (v1.1.1)
- **Purpose:** Glass morphism effects for React
- **Features:** Glassmorphism UI components
- **Documentation:** https://www.npmjs.com/package/liquid-glass-react
- **Use Case:** Modern glass-style UI elements
- **License:** MIT

---

### Styling Utilities (3 packages)

#### tailwind-merge (v3.3.1)
- **Purpose:** Merge Tailwind CSS classes intelligently
- **Features:** Conflict resolution, optimized bundle size
- **Documentation:** https://github.com/dcastil/tailwind-merge
- **Use Case:** Dynamic className composition
- **License:** MIT

#### class-variance-authority (v0.7.1)
- **Purpose:** Create component variants with type safety
- **Features:** TypeScript support, variant composition
- **Documentation:** https://cva.style/docs
- **Use Case:** Creating reusable component variants
- **License:** Apache-2.0

#### clsx (v2.1.1)
- **Purpose:** Utility for constructing className strings
- **Features:** Conditional classes, tiny size (228B)
- **Documentation:** https://github.com/lukeed/clsx
- **Use Case:** Conditional styling throughout the app
- **License:** MIT

---

## Development Dependencies

### TypeScript (4 packages)

#### typescript (v5)
- **Purpose:** TypeScript language compiler
- **Documentation:** https://www.typescriptlang.org/docs/
- **License:** Apache-2.0

#### @types/node (v20)
- **Purpose:** TypeScript definitions for Node.js
- **Documentation:** https://www.npmjs.com/package/@types/node
- **License:** MIT

#### @types/react (v18)
- **Purpose:** TypeScript definitions for React
- **Documentation:** https://www.npmjs.com/package/@types/react
- **License:** MIT

#### @types/react-dom (v18)
- **Purpose:** TypeScript definitions for React DOM
- **Documentation:** https://www.npmjs.com/package/@types/react-dom
- **License:** MIT

#### @types/papaparse (v5.3.16)
- **Purpose:** TypeScript definitions for papaparse
- **Documentation:** https://www.npmjs.com/package/@types/papaparse
- **License:** MIT

---

### CSS & Styling (3 packages)

#### tailwindcss (v3.4.1)
- **Purpose:** Utility-first CSS framework
- **Documentation:** https://tailwindcss.com/docs
- **License:** MIT

#### autoprefixer (v10.4.21)
- **Purpose:** PostCSS plugin to add vendor prefixes
- **Documentation:** https://github.com/postcss/autoprefixer
- **License:** MIT

#### postcss (v8)
- **Purpose:** Tool for transforming CSS with JavaScript
- **Documentation:** https://postcss.org/
- **License:** MIT

---

### Code Quality (2 packages)

#### eslint (v8)
- **Purpose:** JavaScript and TypeScript linter
- **Documentation:** https://eslint.org/docs/latest/
- **License:** MIT

#### eslint-config-next (v15.0.2)
- **Purpose:** ESLint configuration for Next.js projects
- **Documentation:** https://nextjs.org/docs/basic-features/eslint
- **License:** MIT

---

## Dependency Summary

| Category | Count | Total Size (approx) |
|----------|-------|---------------------|
| Production Dependencies | 20 | ~150 MB |
| Development Dependencies | 11 | ~100 MB |
| **Total** | **31** | **~250 MB** |

## Installation Commands

### Install All Dependencies
```bash
npm install
```

### Install Only Production Dependencies
```bash
npm install --production
```

### Install Specific Package
```bash
npm install <package-name>
```

### Update All Dependencies
```bash
npm update
```

### Check for Outdated Packages
```bash
npm outdated
```

## Security Considerations

### Regular Updates
- Check for security updates weekly: `npm audit`
- Fix vulnerabilities: `npm audit fix`
- Manual review: `npm audit fix --force` (use with caution)

### Package Verification
- All packages are from verified publishers
- Regular security audits via GitHub Dependabot
- No known critical vulnerabilities

## License Compliance

All dependencies use permissive open-source licenses:
- **MIT:** Most packages (26)
- **Apache-2.0:** 3 packages
- **ISC:** 1 package (lucide-react)
- **BSD:** 1 package (pdf-parse dependency)

All licenses allow commercial use, modification, and distribution.

## Related Documentation

- `INSTALLATION_GUIDE.md` - Step-by-step installation
- `ENVIRONMENT_SETUP.md` - Environment variables configuration
- `package.json` - Complete dependency list with exact versions
