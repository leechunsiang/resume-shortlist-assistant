# Resume Shortlist Assistant

A modern, AI-powered resume screening and shortlisting web application built with Next.js, React, Tailwind CSS, Supabase, and OpenAI GPT-4.1-nano.

## ✨ Features

- 🎯 **AI-Powered Shortlisting** - Automatic candidate analysis with OpenAI GPT-4.1-nano
- 🔒 **Role-Based Access Control** - Admin, Recruiter, and Viewer roles with granular permissions
- 📝 **Audit Trail** - Complete tracking of all user actions and system events
- 📊 **CSV/PDF Export** - Export job listings, candidates, and audit logs
- 💼 **Job Management** - Create, edit, and manage job postings
- 📄 **Resume Processing** - Upload and parse PDF/TXT resumes
- 🎨 **Modern UI** - Glass morphism effects, animations, and responsive design
- 🔐 **Secure Authentication** - Supabase Auth with email/password

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Custom components
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4.1-nano
- **Animation**: Framer Motion
- **PDF Processing**: pdf-parse, pdf2json
- **Export**: jsPDF, PapaParse
- **Fonts**: Inter (Google Fonts)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (free tier works)
- OpenAI API key (get from https://platform.openai.com/api-keys)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/resume-shortlist-assistant.git
cd resume-shortlist-assistant
```

2. **Install dependencies**

```bash
npm install --legacy-peer-deps
```

3. **Set up environment variables**

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

4. **Set up the database**

- Go to your Supabase project
- Run the SQL migrations in order:
  1. `supabase-schema.sql` - Base schema
  2. `rbac-audit-migration.sql` - RBAC and Audit Trail

5. **Run the development server**

```bash
npm run dev
```

6. **Open the app**

Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
resume-shortlist-assistant/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── ai-shortlist/      # AI analysis endpoint
│   │   ├── audit/                  # Audit logs viewer
│   │   ├── candidates/             # Candidate management
│   │   ├── job-listings/           # Job management
│   │   ├── login/                  # Authentication
│   │   ├── signup/                 # User registration
│   │   ├── organization/           # Organization setup
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Dashboard
│   │   └── globals.css             # Global styles
│   ├── components/
│   │   ├── ui/                     # UI components (buttons, progress, sidebar)
│   │   ├── auth-modal.tsx          # Authentication modal
│   │   ├── dashboard-layout.tsx    # Main layout wrapper
│   │   └── ...                     # Other components
│   └── lib/
│       ├── supabase.ts             # Supabase client & API
│       ├── rbac.ts                 # Role-based access control
│       ├── audit.ts                # Audit trail logging
│       ├── export.ts               # CSV/PDF export utilities
│       ├── gemini.ts               # OpenAI GPT-4.1-nano integration (file name kept for compatibility)
│       └── pdf-parser.ts           # PDF text extraction
├── public/                         # Static assets
├── *.sql                          # Database migrations
├── .env.example                   # Environment variables template
└── Configuration files
```

## 🎯 Key Features Explained

### AI Shortlisting
- Upload multiple resumes (PDF/TXT)
- Automatic analysis with OpenAI GPT-4.1-nano
- Match scoring (0-100)
- Strengths/weaknesses analysis
- Auto-shortlist top candidates

### Role-Based Access Control (RBAC)
- **Admin**: Full access to all features
- **Recruiter**: Manage jobs & candidates, use AI features
- **Viewer**: Read-only access

See `RBAC_AUDIT_EXPORT_DOCS.md` for detailed documentation.

### Audit Trail
- Track all user actions
- Filter by action, resource, date
- Export logs to CSV
- View at `/audit`

### Export Functionality
- Export jobs to CSV/PDF
- Export candidates to CSV/PDF
- Export audit logs to CSV
- Single-click export with format selection

## 📚 Documentation

- `RBAC_AUDIT_EXPORT_DOCS.md` - Complete guide for RBAC, Audit Trail, and Export features
- `AUTH_SETUP.md` - Authentication setup guide
- `SUPABASE_SETUP.md` - Database setup instructions
- `OPENAI_MIGRATION.md` - OpenAI GPT-4.1-nano integration guide
- `PDF_PARSING_IMPLEMENTATION.md` - PDF parsing documentation

## 🔒 Security

- Environment variables for sensitive data
- Row Level Security (RLS) in Supabase
- Secure authentication with Supabase Auth
- Audit logging for compliance
- Permission-based access control

## 🚦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🎨 Design Features

- **Glass Morphism**: Premium button effects
- **Animations**: Framer Motion for smooth transitions
- **Responsive**: Mobile-first design
- **Dark Theme**: Professional dark UI with colorful accents
- **Typography**: Inter font family

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Supabase for the backend infrastructure
- OpenAI for GPT-4.1-nano API
- shadcn for UI components inspiration

---

**Note**: Remember to never commit your `.env.local` file or any sensitive credentials to Git!
