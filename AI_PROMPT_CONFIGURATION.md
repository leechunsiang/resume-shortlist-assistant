# AI Analysis Settings - User Guide

## Overview
The **Filters** page provides a simple, user-friendly way to configure how AI evaluates your candidates. No technical knowledge required!

## What You Can Do

### 1. Choose an Analysis Style
Pick from 6 pre-built templates that match your hiring needs:

#### 📊 Balanced Evaluation (Default)
- Equal weight to all factors
- Well-rounded assessment
- **Focus:** Technical Skills, Work Experience, Education, Cultural Fit

#### 💻 Technical Skills Focus
- Prioritizes technical abilities
- Best for engineering/IT roles
- **Focus:** Programming Languages, Technologies, Technical Projects, Problem Solving

#### 💼 Experience First
- Emphasizes years of experience
- Ideal for senior positions
- **Focus:** Years of Experience, Career Progression, Past Achievements, Industry Knowledge

#### 🎓 Education Focused
- Values academic background
- Great for entry-level positions
- **Focus:** Degrees, Certifications, Academic Achievements, Relevant Coursework

#### ❤️ Culture & Soft Skills
- Focuses on team fit
- Perfect for collaborative roles
- **Focus:** Communication, Teamwork, Leadership, Values Alignment

#### ⚡ Startup Mindset
- Looks for adaptability
- Tailored for startups
- **Focus:** Adaptability, Multi-tasking, Startup Experience, Self-Management

### 2. Set Match Threshold
Use the slider to set the minimum score (0-100) for candidates:
- **0-49:** Very lenient - Most candidates will match
- **50-69:** Moderate - Balanced filtering
- **70-84:** Strict - Only good matches
- **85-100:** Very strict - Only exceptional candidates

### 3. Automatic Actions
Toggle these features on/off:

**Auto-Shortlist Top Candidates**
- Automatically shortlist candidates who score above your threshold
- Saves time on manual review

**Strict Matching Mode**
- Requires all key requirements to be met
- More restrictive filtering
- Use for roles with non-negotiable requirements

## How to Use

### Step 1: Go to Filters Page
1. Click "Filters" in the sidebar
2. Or visit: `http://localhost:3000/filters`

### Step 2: Choose Your Analysis Style
1. Browse the 6 template cards
2. Click on the one that matches your hiring needs
3. See the green checkmark appear when selected
4. Review the "Currently Selected" section to see what AI will focus on

### Step 3: Adjust Match Threshold
1. Use the slider to set your minimum score
2. Watch the emoji indicator change based on strictness level
3. Lower = more candidates pass, Higher = fewer but better matches

### Step 4: Configure Auto-Actions
1. Toggle "Auto-Shortlist" ON to automatically shortlist top candidates
2. Toggle "Strict Mode" ON for stricter requirement matching
3. Both are optional - customize to your workflow

### Step 5: Save Your Settings
1. Click "Save Settings" button at the top
2. Wait for "Saved!" confirmation
3. Your settings are now active for all future AI analysis!

## When Your Settings Are Used

Your configured settings apply whenever:
- ✅ You upload new resumes to a job
- ✅ You click "AI Shortlist" on a job listing
- ✅ Batch candidate analysis runs
- ✅ Any AI evaluation of candidates happens

## Examples

### Example 1: Hiring Junior Developers
**Best Template:** Technical Skills Focus
**Threshold:** 60-70 (Moderate)
**Auto-Shortlist:** ON
**Strict Mode:** OFF
*Rationale: Focus on technical ability, but be flexible for entry-level*

### Example 2: Hiring Senior Leadership
**Best Template:** Experience First
**Threshold:** 80-90 (Very Strict)
**Auto-Shortlist:** OFF (Manual review)
**Strict Mode:** ON
*Rationale: High standards, manual review of all candidates*

### Example 3: Hiring for Startup
**Best Template:** Startup Mindset
**Threshold:** 65-75 (Moderate-Strict)
**Auto-Shortlist:** ON
**Strict Mode:** OFF
*Rationale: Value adaptability over perfect match*

### Example 4: Graduate Program
**Best Template:** Education Focused
**Threshold:** 55-65 (Moderate)
**Auto-Shortlist:** ON
**Strict Mode:** OFF
*Rationale: Prioritize academic achievements, broader pool*

## Benefits

✅ **No Technical Knowledge Required** - Simple point-and-click interface
✅ **Visual Feedback** - See exactly what AI will focus on
✅ **Instant Application** - Settings apply immediately after saving
✅ **Flexible** - Easy to change as your needs evolve
✅ **Template-Based** - Pre-built options for common scenarios
✅ **Clear Indicators** - Visual cues show current selections

## Tips for Best Results

1. **Start with Balanced** - Try the default template first
2. **Adjust Gradually** - Make small threshold changes and test
3. **Match Job Type** - Technical roles → Technical template, etc.
4. **Review Results** - Check a few candidates to ensure good filtering
5. **Seasonal Adjustments** - Change settings during hiring surges
6. **Save Often** - Remember to click Save after changes!

## FAQs

**Q: What happens if I don't configure anything?**
A: The system uses "Balanced Evaluation" with threshold 70 by default.

**Q: Can different jobs use different settings?**
A: Currently, settings apply organization-wide. Future updates may add per-job configuration.

**Q: Do I need to save every time?**
A: Yes, click "Save Settings" to persist your changes.

**Q: What if I change my mind?**
A: Just come back to the Filters page and select a different template or adjust settings.

**Q: Will this affect existing candidates?**
A: No, only new analysis uses updated settings. Existing scores remain unchanged.

**Q: Can I see what the AI is doing behind the scenes?**
A: The templates define focus areas (shown in the cards). The AI automatically adjusts its evaluation based on your selection.

## Troubleshooting

**Settings not saving:**
- Check that your browser allows localStorage
- Try refreshing the page
- Ensure you clicked "Save Settings"

**AI results don't match expectations:**
- Try adjusting the threshold
- Switch to a different template
- Enable/disable strict mode
- Review job requirements for clarity

**Too many/few candidates passing:**
- Adjust the match threshold slider
- Try a stricter or more lenient template
- Toggle strict mode

## Technical Notes (For Developers)

Settings are stored in browser localStorage with keys:
- `ai_template_{organizationId}` - Selected template name
- `ai_threshold_{organizationId}` - Match threshold value
- `ai_auto_shortlist_{organizationId}` - Auto-shortlist boolean
- `ai_strict_mode_{organizationId}` - Strict mode boolean

These settings are read when making API calls to `/api/ai-shortlist` and influence how the AI evaluates candidates.

## Future Improvements

Coming soon:
- [ ] Per-job template selection
- [ ] Custom template builder
- [ ] A/B testing different templates
- [ ] Analytics on template performance
- [ ] Industry-specific templates
- [ ] Team-level template sharing
