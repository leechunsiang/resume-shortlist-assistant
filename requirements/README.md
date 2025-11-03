# Requirements Documentation

This folder contains comprehensive documentation for installing and configuring all dependencies required for the Resume Shortlist Assistant project.

## 📚 Documentation Files

### 1. [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md)
**Complete step-by-step installation instructions**
- Prerequisites and system requirements
- Installation commands for npm/yarn
- Troubleshooting common issues
- Verification steps
- Next steps after installation

**Start here if:** You're setting up the project for the first time.

---

### 2. [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
**Environment variables configuration guide**
- Required environment variables
- How to get API keys (Supabase, Google Gemini AI)
- `.env.local` file setup
- Security best practices
- Troubleshooting environment issues

**Start here if:** You've installed dependencies and need to configure API keys.

---

### 3. [DEPENDENCIES.md](./DEPENDENCIES.md)
**Detailed dependency reference**
- Complete list of all 31 dependencies
- Purpose and features of each package
- Documentation links
- License information
- Security considerations

**Start here if:** You want to understand what each dependency does.

---

## 🚀 Quick Start

### For First-Time Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```
   See [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md) for details.

2. **Setup Environment Variables**
   - Create `.env.local` file
   - Add Supabase credentials
   - Add Google Gemini AI key
   
   See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for details.

3. **Run Development Server**
   ```bash
   npm run dev
   ```

### For Existing Projects

If you're joining an existing project:

1. Clone the repository
2. Follow [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md)
3. Get environment variables from team lead
4. Configure according to [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)

---

## 📋 Checklist

Use this checklist to track your setup progress:

- [ ] Node.js v18.17+ installed
- [ ] npm v9+ installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` file created
- [ ] Supabase project created
- [ ] Supabase credentials added to `.env.local`
- [ ] Google Gemini AI API key obtained
- [ ] Gemini API key added to `.env.local`
- [ ] Development server runs successfully (`npm run dev`)
- [ ] No errors in console
- [ ] Can access http://localhost:3000

---

## 🔗 Related Documentation

### Project Setup
- `../SUPABASE_SETUP.md` - Database schema and setup
- `../AUTH_SETUP.md` - Authentication configuration
- `../GEMINI_AI_SETUP.md` - AI integration setup

### Feature Documentation
- `../AI_SHORTLIST_FEATURE.md` - AI shortlisting feature
- `../PDF_PARSING_IMPLEMENTATION.md` - PDF processing
- `../RBAC_AUDIT_EXPORT_DOCS.md` - Role-based access control

### Architecture
- `../DATABASE_ARCHITECTURE.md` - Database design
- `../README.md` - Project overview
- `../.github/copilot-instructions.md` - Development guidelines

---

## 📊 System Requirements

### Minimum Requirements
- **Node.js:** v18.17.0 or higher
- **npm:** v9.0.0 or higher
- **Disk Space:** 500 MB for node_modules
- **RAM:** 4 GB minimum
- **OS:** Windows 10+, macOS 10.15+, or Linux

### Recommended Requirements
- **Node.js:** v20.x LTS
- **npm:** v10.x
- **Disk Space:** 1 GB
- **RAM:** 8 GB or more
- **Internet:** Required for API calls

---

## 🆘 Getting Help

### Common Issues

**Issue:** Cannot find module errors
- **Solution:** Run `npm install` again
- See [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md) → Troubleshooting

**Issue:** Environment variables not loading
- **Solution:** Restart dev server, check `.env.local`
- See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) → Troubleshooting

**Issue:** Supabase connection errors
- **Solution:** Verify API keys are correct
- See `../SUPABASE_SETUP.md`

**Issue:** PDF parsing errors
- **Solution:** Check pdf-parse installation
- See [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md) → Troubleshooting

### Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [Google Gemini AI Docs](https://ai.google.dev/docs)
- [Project GitHub Issues](https://github.com/your-repo/issues)

---

## 🔄 Updating Dependencies

### Check for Updates
```bash
npm outdated
```

### Update All Dependencies
```bash
npm update
```

### Update Specific Package
```bash
npm update <package-name>
```

### Security Audit
```bash
npm audit
npm audit fix
```

---

## 📝 Notes

- All dependencies are listed in `../package.json`
- Environment variables are never committed to git
- Use different API keys for development and production
- Keep dependencies updated for security patches
- Test thoroughly after updating major versions

---

## 🎯 Next Steps After Setup

Once you've completed the setup:

1. **Explore the Application**
   - Run `npm run dev`
   - Visit http://localhost:3000
   - Create an account and test features

2. **Read Feature Documentation**
   - AI Shortlisting: `../AI_SHORTLIST_FEATURE.md`
   - Authentication: `../AUTH_SETUP.md`
   - PDF Processing: `../PDF_PARSING_IMPLEMENTATION.md`

3. **Set Up Database**
   - Follow `../SUPABASE_SETUP.md`
   - Run migrations from `../supabase-schema.sql`

4. **Start Developing**
   - Review `../.github/copilot-instructions.md`
   - Check project structure in `../README.md`
   - Begin implementing features

---

## 📞 Support

For additional help:
- Check documentation in parent directory
- Review existing issues
- Contact project maintainers
- Consult official package documentation

---

**Last Updated:** November 2025  
**Project Version:** 0.1.0  
**Node Version:** 18.17+  
**Next.js Version:** 15.0.2
