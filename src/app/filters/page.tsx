'use client';

import { useEffect, useState } from 'react';
import { useOrganization } from '@/contexts/organization-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/supabase';
import TextType from '@/components/text-type';
import { GlassButton } from '@/components/ui/glass-button';
import { Save, Sparkles, Briefcase, Heart, Code, GraduationCap, Zap, CheckCircle2 } from 'lucide-react';

// Pre-defined templates for different hiring scenarios
const ANALYSIS_TEMPLATES = {
  balanced: {
    name: 'Balanced Evaluation',
    icon: <Sparkles className="w-5 h-5" />,
    description: 'Equal weight to skills, experience, and education',
    emphasis: 'Provides a well-rounded assessment of candidates',
    focusAreas: ['Technical Skills', 'Work Experience', 'Education', 'Cultural Fit'],
    color: 'emerald',
  },
  technical: {
    name: 'Technical Skills Focus',
    icon: <Code className="w-5 h-5" />,
    description: 'Prioritizes technical abilities and hands-on experience',
    emphasis: 'Best for engineering, IT, and technical roles',
    focusAreas: ['Programming Languages', 'Technologies & Tools', 'Technical Projects', 'Problem Solving'],
    color: 'blue',
  },
  experience: {
    name: 'Experience First',
    icon: <Briefcase className="w-5 h-5" />,
    description: 'Emphasizes years of experience and past achievements',
    emphasis: 'Ideal for senior positions and leadership roles',
    focusAreas: ['Years of Experience', 'Career Progression', 'Past Achievements', 'Industry Knowledge'],
    color: 'purple',
  },
  education: {
    name: 'Education Focused',
    icon: <GraduationCap className="w-5 h-5" />,
    description: 'Values academic background and qualifications',
    emphasis: 'Great for entry-level and academic positions',
    focusAreas: ['Degrees & Certifications', 'Academic Achievements', 'Relevant Coursework', 'Research'],
    color: 'indigo',
  },
  culture: {
    name: 'Culture & Soft Skills',
    icon: <Heart className="w-5 h-5" />,
    description: 'Focuses on team fit and interpersonal abilities',
    emphasis: 'Perfect for roles requiring strong collaboration',
    focusAreas: ['Communication Skills', 'Teamwork', 'Leadership Qualities', 'Values Alignment'],
    color: 'pink',
  },
  startup: {
    name: 'Startup Mindset',
    icon: <Zap className="w-5 h-5" />,
    description: 'Looks for adaptability, versatility, and self-starters',
    emphasis: 'Tailored for fast-paced startup environments',
    focusAreas: ['Adaptability', 'Multi-tasking Ability', 'Startup Experience', 'Self-Management'],
    color: 'yellow',
  },
};

export default function FiltersPage() {
  const router = useRouter();
  const { currentOrganization, loading: orgLoading } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Simple user-friendly settings
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof ANALYSIS_TEMPLATES>('balanced');
  const [matchThreshold, setMatchThreshold] = useState(70);
  const [autoShortlist, setAutoShortlist] = useState(true);
  const [strictMode, setStrictMode] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      if (orgLoading) return;
      
      const user = await authApi.getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }
      
      if (!currentOrganization) {
        router.push('/organization/setup');
        return;
      }
      
      // Load saved settings from localStorage
      const savedTemplate = localStorage.getItem(`ai_template_${currentOrganization.id}`);
      const savedThreshold = localStorage.getItem(`ai_threshold_${currentOrganization.id}`);
      const savedAutoShortlist = localStorage.getItem(`ai_auto_shortlist_${currentOrganization.id}`);
      const savedStrictMode = localStorage.getItem(`ai_strict_mode_${currentOrganization.id}`);
      
      if (savedTemplate && savedTemplate in ANALYSIS_TEMPLATES) {
        setSelectedTemplate(savedTemplate as keyof typeof ANALYSIS_TEMPLATES);
      }
      if (savedThreshold) {
        setMatchThreshold(parseInt(savedThreshold));
      }
      if (savedAutoShortlist) {
        setAutoShortlist(savedAutoShortlist === 'true');
      }
      if (savedStrictMode) {
        setStrictMode(savedStrictMode === 'true');
      }
    }
    
    checkAuth();
  }, [currentOrganization, orgLoading, router]);

  const handleSave = async () => {
    if (!currentOrganization) return;
    
    setLoading(true);
    setSaved(false);
    
    try {
      // Save settings to localStorage
      localStorage.setItem(`ai_template_${currentOrganization.id}`, selectedTemplate);
      localStorage.setItem(`ai_threshold_${currentOrganization.id}`, matchThreshold.toString());
      localStorage.setItem(`ai_auto_shortlist_${currentOrganization.id}`, autoShortlist.toString());
      localStorage.setItem(`ai_strict_mode_${currentOrganization.id}`, strictMode.toString());
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const currentTemplate = ANALYSIS_TEMPLATES[selectedTemplate];

  return (
    <DashboardLayout>
      {orgLoading ? (
        <div className="flex-1 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-400">Loading organization...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          {/* Header */}
          <header className="bg-transparent px-8 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  <TextType 
                    text="AI Analysis Settings"
                    speed={50}
                    cursor={true}
                    cursorChar="|"
                  />
                </h1>
                <p className="text-gray-400">Choose how AI evaluates your candidates</p>
              </div>
              <GlassButton
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {saved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save Settings'}
                  </>
                )}
              </GlassButton>
            </div>
          </header>

          {/* Content */}
          <div className="px-8 pb-8 space-y-6">
            {/* Info Card */}
            <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/30 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Simple AI Configuration</h3>
                  <p className="text-gray-300 text-sm mb-2">
                    No AI knowledge needed! Just pick a template that matches your hiring style, and our AI will automatically adjust how it evaluates candidates.
                  </p>
                  <p className="text-gray-400 text-sm">
                    Your settings are saved and will be used for all future candidate analysis.
                  </p>
                </div>
              </div>
            </div>

            {/* Analysis Style Templates */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Choose Your Analysis Style</h2>
              <p className="text-gray-400 text-sm mb-4">
                Select a template that best matches what you're looking for in candidates:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(ANALYSIS_TEMPLATES).map(([key, template]) => {
                  const isSelected = selectedTemplate === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedTemplate(key as keyof typeof ANALYSIS_TEMPLATES)}
                      className={`text-left p-5 rounded-2xl border-2 transition-all duration-300 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                          : 'border-gray-700 bg-gray-800/30 hover:border-gray-600 hover:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700/50 text-gray-400'
                        }`}>
                          {template.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-bold mb-1 ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                            {template.name}
                          </h3>
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" />
                              Selected
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm mb-3">{template.description}</p>
                      <p className="text-gray-500 text-xs mb-3 italic">{template.emphasis}</p>
                      <div className="flex flex-wrap gap-1">
                        {template.focusAreas.map((area, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded text-xs ${
                              isSelected
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-gray-700/30 text-gray-400 border border-gray-600/30'
                            }`}
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Selection Details */}
            <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border border-emerald-500/30 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Currently Selected: {currentTemplate.name}
              </h3>
              <p className="text-gray-300 text-sm mb-3">
                When analyzing candidates, our AI will focus on:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {currentTemplate.focusAreas.map((area, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-gray-300 text-sm">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                    {area}
                  </div>
                ))}
              </div>
            </div>

            {/* Match Threshold */}
            <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4">Match Score Threshold</h2>
              <p className="text-gray-400 text-sm mb-4">
                Set the minimum score (0-100) required for a candidate to be considered a good match:
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Minimum Match Score:</span>
                  <span className="text-3xl font-bold text-emerald-400">{matchThreshold}</span>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={matchThreshold}
                  onChange={(e) => setMatchThreshold(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0 (Any)</span>
                  <span>50 (Average)</span>
                  <span>100 (Perfect)</span>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-sm text-gray-300">
                    {matchThreshold < 50 && '🟢 Very lenient - Most candidates will match'}
                    {matchThreshold >= 50 && matchThreshold < 70 && '🟡 Moderate - Balanced filtering'}
                    {matchThreshold >= 70 && matchThreshold < 85 && '🟠 Strict - Only good matches'}
                    {matchThreshold >= 85 && '🔴 Very strict - Only exceptional candidates'}
                  </p>
                </div>
              </div>
            </div>

            {/* Auto Shortlist Settings */}
            <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4">Automatic Actions</h2>
              
              <div className="space-y-4">
                {/* Auto Shortlist */}
                <div className="flex items-start justify-between p-4 bg-gray-800/30 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">Auto-Shortlist Top Candidates</h3>
                    <p className="text-sm text-gray-400">
                      Automatically shortlist candidates who score above the threshold
                    </p>
                  </div>
                  <button
                    onClick={() => setAutoShortlist(!autoShortlist)}
                    className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      autoShortlist ? 'bg-emerald-500' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        autoShortlist ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Strict Mode */}
                <div className="flex items-start justify-between p-4 bg-gray-800/30 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">Strict Matching Mode</h3>
                    <p className="text-sm text-gray-400">
                      Require all key requirements to be met (more restrictive filtering)
                    </p>
                  </div>
                  <button
                    onClick={() => setStrictMode(!strictMode)}
                    className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      strictMode ? 'bg-emerald-500' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        strictMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Save Reminder */}
            <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 border border-yellow-500/30 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-yellow-400 mb-2">💡 Don't Forget to Save!</h3>
              <p className="text-gray-300 text-sm">
                Click the "Save Settings" button at the top to apply your changes. Your settings will be used for all future AI analysis.
              </p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
