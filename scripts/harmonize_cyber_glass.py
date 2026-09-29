import re

# 1. Clean src/app/globals.css
with open('src/app/globals.css', 'r') as f:
    css = f.read()

# Remove all data-theme overrides block
if '/* -------------------------------------------------------------------------- */' in css:
    css = css.split('/* -------------------------------------------------------------------------- */')[0]

# Add clean Cyber-Glass root variables
cyber_glass_css = '''
:root {
  --background: #070d18;
  --foreground: #eaeeff;
  --card-bg: #091121;
  --card-border: rgba(6, 182, 212, 0.25);
  --accent-cyan: #06b6d4;
  --accent-teal: #14b8a6;
}

body {
  background-color: #070d18 !important;
  color: #eaeeff !important;
  font-family: var(--font-sans), system-ui, -apple-system, sans-serif;
}
'''

if ':root {' not in css:
    css = cyber_glass_css + css

with open('src/app/globals.css', 'w') as f:
    f.write(css.strip() + '\n')
print("Cleaned globals.css to Cyber-Glass")

# 2. Update src/lib/theme/ThemeContext.tsx
theme_context = ''''use client';

import React, { createContext, useContext } from 'react';

export type AppThemeStyle = 'cyber-glass';

interface ThemeContextType {
  themeStyle: AppThemeStyle;
  setThemeStyle: (theme: AppThemeStyle) => void;
  isMaterialCobalt: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={{ themeStyle: 'cyber-glass', setThemeStyle: () => {}, isMaterialCobalt: false }}>
      <div data-theme="cyber-glass" className="theme-cyber-glass">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      themeStyle: 'cyber-glass' as AppThemeStyle,
      setThemeStyle: () => {},
      isMaterialCobalt: false,
    };
  }
  return context;
}
'''
with open('src/lib/theme/ThemeContext.tsx', 'w') as f:
    f.write(theme_context)
print("Updated ThemeContext.tsx")

# 3. Update src/app/page.tsx
with open('src/app/page.tsx', 'r') as f:
    page = f.read()

# Remove MaterialYouPOC and ColorPaletteModal imports & usages
page = page.replace("import { MaterialYouPOC } from '@/components/MaterialYouPOC';", "")
page = page.replace("import { ColorPaletteModal } from '@/components/ColorPaletteModal';", "")
page = page.replace("const [designTheme, setDesignTheme] = useState<'classic' | 'materialyou'>('classic');", "")
page = page.replace("const [isPaletteModalOpen, setIsPaletteModalOpen] = useState(false);", "")
page = page.replace("onOpenPaletteModal={() => setIsPaletteModalOpen(true)}", "")

# Remove MaterialYouPOC conditional render branch
material_branch = '''  if (designTheme === 'materialyou') {
    return <MaterialYouPOC onBackToClassic={() => setDesignTheme('classic')} />;
  }'''
page = page.replace(material_branch, "")

# Remove ColorPaletteModal render tag
palette_modal_tag = '''      <ColorPaletteModal
        isOpen={isPaletteModalOpen}
        onClose={() => setIsPaletteModalOpen(false)}
      />'''
page = page.replace(palette_modal_tag, "")

# Update root container and header styling to Cyber-Glass
page = page.replace(
    'className="flex h-screen flex-col bg-[#0a1128] text-[#eaeeff] overflow-hidden font-sans"',
    'className="flex h-screen flex-col bg-[#070d18] text-[#eaeeff] overflow-hidden font-sans"'
).replace(
    'className="flex h-screen flex-col bg-[#0e121e] text-[#eaeeff] overflow-hidden font-sans"',
    'className="flex h-screen flex-col bg-[#070d18] text-[#eaeeff] overflow-hidden font-sans"'
).replace(
    'header className="h-16 border-b border-[#1e3a78] bg-[#121e3d]/95',
    'header className="h-16 border-b border-cyan-500/20 bg-[#08101e]/90'
).replace(
    'header className="h-16 border-b border-[#2d3a5e] bg-[#181f33]/95',
    'header className="h-16 border-b border-cyan-500/20 bg-[#08101e]/90'
)

# Update top navigation tabs to Cyber-Glass
old_page_tabs = '''          {/* Clean Top Navigation Tabs — Perfect Nested Geometry with Overflow Clip */}
          <div className="hidden sm:flex items-center gap-1 p-0.5 h-8 rounded-lg bg-[#0e121e] border border-[#2d3a5e] text-xs font-mono overflow-hidden">
            <button
              onClick={() => setActiveTab('wizard')}
              className={`h-7 px-3 rounded-md transition-all cursor-pointer flex items-center justify-center ${
                activeTab === 'wizard'
                  ? 'bg-[#2b4578] text-[#d8e2ff] border border-[#3b5ba9] font-bold shadow-sm'
                  : 'text-[#8e9aaf] hover:text-[#d8e2ff] hover:bg-[#181f33]'
              }`}
            >
              {t.header.wizardTab}
            </button>
            <button
              onClick={() => {
                setActiveTab('chat');
                const userStoredAgents = AgentStorageService.getAllAgents();
                setStoredAgents(userStoredAgents);
                if (selectedAgent && !userStoredAgents.some((a) => a.id === selectedAgent.id)) {
                  setSelectedAgent(null);
                }
              }}
              className={`h-7 px-3 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'chat'
                  ? 'bg-[#2b4578] text-[#d8e2ff] border border-[#3b5ba9] font-bold shadow-sm'
                  : 'text-[#8e9aaf] hover:text-[#d8e2ff] hover:bg-[#181f33]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{t.header.chatTab}</span>
              {selectedAgent ? (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#181f33] text-[#b0c6ff] border border-[#2d3a5e] font-mono font-medium hidden md:inline">
                  {selectedAgent.name}
                </span>
              ) : null}
            </button>
          </div>'''

new_page_tabs = '''          {/* Unified Cyber-Glass Navigation Tabs */}
          <div className="hidden sm:flex items-center gap-1 p-0.5 h-8 rounded-lg bg-[#070d18] border border-cyan-500/25 text-xs font-mono overflow-hidden shadow-sm">
            <button
              onClick={() => setActiveTab('wizard')}
              className={`h-7 px-3 rounded-md transition-all cursor-pointer flex items-center justify-center ${
                activeTab === 'wizard'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              {t.header.wizardTab}
            </button>
            <button
              onClick={() => {
                setActiveTab('chat');
                const userStoredAgents = AgentStorageService.getAllAgents();
                setStoredAgents(userStoredAgents);
                if (selectedAgent && !userStoredAgents.some((a) => a.id === selectedAgent.id)) {
                  setSelectedAgent(null);
                }
              }}
              className={`h-7 px-3 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'chat'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{t.header.chatTab}</span>
              {selectedAgent ? (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 font-mono font-medium hidden md:inline">
                  {selectedAgent.name}
                </span>
              ) : null}
            </button>
          </div>'''

page = page.replace(old_page_tabs, new_page_tabs)

with open('src/app/page.tsx', 'w') as f:
    f.write(page)
print("Updated page.tsx to Cyber-Glass")

# 4. Update LanguageSwitcher.tsx to Cyber-Glass
lang_switcher_code = ''''use client';

import React from 'react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
  const { locale, setLocale } = useI18n();

  return (
    <div
      className={`inline-flex items-center gap-1 p-0.5 h-8 rounded-lg bg-[#070d18] border border-cyan-500/25 shadow-sm text-xs font-mono select-none overflow-hidden ${className}`}
      role="group"
      aria-label="Language Switcher"
    >
      <div className="pl-2 pr-1 text-cyan-400 hidden sm:flex items-center">
        <Globe className="w-3.5 h-3.5" />
      </div>

      <button
        type="button"
        onClick={() => setLocale('cs')}
        className={`h-7 px-2.5 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
          locale === 'cs'
            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
        }`}
        title="Přepnout do češtiny"
        aria-label="Přepnout do češtiny"
        aria-pressed={locale === 'cs'}
      >
        <span>🇨🇿</span>
        <span>CZ</span>
      </button>

      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`h-7 px-2.5 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
          locale === 'en'
            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
        }`}
        title="Switch to English"
        aria-label="Switch to English"
        aria-pressed={locale === 'en'}
      >
        <span>🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
};
'''
with open('src/components/LanguageSwitcher.tsx', 'w') as f:
    f.write(lang_switcher_code)
print("Updated LanguageSwitcher.tsx to Cyber-Glass")

# 5. Update HeaderEngineSwitcher.tsx to Cyber-Glass
with open('src/components/HeaderEngineSwitcher.tsx', 'r') as f:
    engine = f.read()

engine = engine.replace(
    'className={`flex items-center gap-2 px-3 h-8 rounded-lg text-xs font-medium border transition-all cursor-pointer shadow-sm backdrop-blur-md ${',
    'className={`flex items-center gap-2 px-3 h-8 rounded-lg text-xs font-medium border transition-all cursor-pointer shadow-sm backdrop-blur-md ${'
).replace(
    'bg-[#0a1128]/90 border-[#1e3a78] text-[#dbeafe] hover:border-[#2563eb] hover:bg-[#121e3d]',
    'bg-[#081224]/90 border-cyan-500/30 text-slate-200 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)]'
).replace(
    'bg-[#0e121e]/90 border-[#2d3a5e] text-[#d8e2ff] hover:border-[#3b5ba9] hover:bg-[#181f33]',
    'bg-[#081224]/90 border-cyan-500/30 text-slate-200 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)]'
).replace(
    'bg-[#2563eb]',
    'bg-cyan-400'
).replace(
    'text-[#60a5fa]',
    'text-cyan-400'
).replace(
    'bg-[#121e3d] border border-[#1e3a78] text-[#60a5fa]',
    'bg-cyan-950/80 border border-cyan-500/30 text-cyan-300'
).replace(
    'bg-[#121e3d] border border-[#1e3a78]',
    'bg-[#08101d]/98 border border-cyan-500/40'
).replace(
    'bg-[#1d4ed8] border border-[#2563eb] text-[#dbeafe]',
    'bg-cyan-950/60 border border-cyan-500/50 text-cyan-200'
).replace(
    'bg-gradient-to-r from-[#1d4ed8] to-[#1e3a78] hover:from-[#2563eb] hover:to-[#1d4ed8] border border-[#2563eb] text-[#dbeafe]',
    'bg-gradient-to-r from-cyan-950 to-teal-950 hover:from-cyan-900 hover:to-teal-900 border border-cyan-500/40 text-cyan-300'
)

with open('src/components/HeaderEngineSwitcher.tsx', 'w') as f:
    f.write(engine)
print("Updated HeaderEngineSwitcher.tsx to Cyber-Glass")

# 6. Update UserProfileCapsule.tsx to Cyber-Glass
user_profile_code = ''''use client';
import { useI18n } from '@/lib/i18n/I18nContext';

import React, { useState, useRef, useEffect } from "react";
import { Brain, User, LogOut, Shield, ChevronDown, Sparkles } from "lucide-react";
import { AIProviderConfig } from "@/lib/agent/engine-config";
import { useAuth } from "@/lib/auth/AuthContext";
import { GoogleLoginModal } from "@/components/auth/GoogleLoginModal";
import { GoogleClientIdModal } from "@/components/auth/GoogleClientIdModal";

interface UserProfileCapsuleProps {
  userName?: string;
  demoRunsRemaining?: number;
  activeProvider?: AIProviderConfig;
  onOpenSubscriptionModal?: () => void;
  onOpenMemoryModal: () => void;
}

export const UserProfileCapsule: React.FC<UserProfileCapsuleProps> = ({
  onOpenMemoryModal,
}) => {
  const { user, logout, isLoginModalOpen, setIsLoginModalOpen, isClientIdModalOpen, setIsClientIdModalOpen } = useAuth();
  const { locale } = useI18n();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 relative" ref={dropdownRef}>
      {/* RAG Memory Quick Button */}
      <button
        onClick={onOpenMemoryModal}
        className="hidden md:flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#06101e] hover:bg-cyan-950/60 border border-cyan-500/25 hover:border-cyan-400/50 text-xs transition-all cursor-pointer group shadow-sm text-slate-300 hover:text-cyan-300"
        title={locale === "en" ? "Show personal AI memory, biometrics and history" : "Zobrazit osobní paměť AI, biometrii a historii posudků"}
      >
        <Brain className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
        <span className="text-xs font-mono font-medium">{locale === "en" ? "AI Memory" : "Paměť AI"}</span>
      </button>

      {/* User Login Button or Profile Capsule */}
      {!user ? (
        <button
          onClick={() => setIsLoginModalOpen(true)}
          className="flex items-center gap-2 px-3 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-400 text-xs font-medium text-slate-100 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          title={locale === "en" ? "Sign in with Google" : "Přihlásit se přes Google"}
        >
          {/* Google Icon SVG */}
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.31 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29C.47 8.21 0 10.05 0 12s.47 3.79 1.29 5.42l3.99-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span className="font-semibold text-cyan-300">{locale === "en" ? "Sign in" : "Přihlásit se"}</span>
        </button>
      ) : (
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-2 h-8 rounded-lg bg-[#060c18] border border-cyan-500/30 hover:border-cyan-400/60 transition-all cursor-pointer group text-slate-200"
            title={`Profil: ${user.name}`}
          >
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-5 h-5 rounded-md object-cover border border-cyan-400/40"
              />
            ) : (
              <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-slate-950 font-bold text-[10px] shadow-sm">
                <User className="w-3 h-3 text-slate-950" />
              </div>
            )}
            <span className="hidden lg:inline text-xs font-semibold group-hover:text-cyan-300 transition-colors">
              {user.name.split(" ")[0]}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-cyan-300 transition-colors" />
          </button>

          {/* User Profile Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 p-3 rounded-xl bg-[#09111e]/98 border border-cyan-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl z-50 text-slate-100 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* User Identity Box */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs shrink-0 shadow-sm">
                    {user.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden min-w-0">
                    <p className="text-xs font-bold text-slate-100 truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono truncate">{user.email}</p>
                  </div>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-teal-400" /> Metoda: Google Auth
                  </span>
                  <span className="text-cyan-400 font-mono font-bold">{locale === "en" ? "Active" : "Aktivní"}</span>
                </div>
              </div>

              {/* Menu Actions */}
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenMemoryModal();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-850 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Paměť AI & Historie</span>
                </button>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-rose-950/50 text-rose-300 hover:text-rose-200 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Odhlásit se</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Login Modal */}
      <GoogleLoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      <GoogleClientIdModal isOpen={isClientIdModalOpen} onClose={() => setIsClientIdModalOpen(false)} />
    </div>
  );
};
'''
with open('src/components/UserProfileCapsule.tsx', 'w') as f:
    f.write(user_profile_code)
print("Updated UserProfileCapsule.tsx to Cyber-Glass")

# 7. Update AgentCategoryLauncher.tsx to Cyber-Glass
with open('src/components/AgentCategoryLauncher.tsx', 'r') as f:
    launcher = f.read()

# Replace any remaining deep blue or navy hex values with Cyber-Glass equivalents
launcher_replacements = [
    ("border-[#1e3a78]", "border-cyan-500/25"),
    ("border-[#2d3a5e]", "border-cyan-500/25"),
    ("border-[#2563eb]", "border-cyan-500/40"),
    ("bg-[#0a1128]", "bg-[#091121]/90"),
    ("bg-[#0e121e]", "bg-[#091121]/90"),
    ("bg-[#121e3d]", "bg-[#091121]/90"),
    ("bg-[#181f33]", "bg-[#091121]/90"),
    ("bg-[#1d4ed8]", "bg-cyan-950"),
    ("bg-[#2563eb]", "bg-cyan-500"),
    ("bg-[#2b4578]", "bg-cyan-500/20"),
    ("text-[#60a5fa]", "text-cyan-400"),
    ("text-[#b0c6ff]", "text-cyan-400"),
    ("text-[#dbeafe]", "text-cyan-300"),
    ("text-[#d8e2ff]", "text-cyan-300"),
    ("from-[#1d4ed8] via-[#3b82f6] to-[#1d4ed8]", "from-cyan-500 to-teal-400"),
    ("from-[#2563eb] via-[#3b82f6] to-[#1d4ed8]", "from-cyan-400 via-teal-400 to-cyan-300"),
    ("from-[#60a5fa] via-[#93c5fd] to-[#60a5fa]", "from-cyan-400 via-teal-400 to-cyan-300"),
    ("text-[#002d6f]", "text-slate-950"),
]

for old, new in launcher_replacements:
    launcher = launcher.replace(old, new)

with open('src/components/AgentCategoryLauncher.tsx', 'w') as f:
    f.write(launcher)
print("Updated AgentCategoryLauncher.tsx to Cyber-Glass")

# 8. Update UI Primitives (Card, Badge, Button, Toast)
with open('src/components/ui/Card.tsx', 'r') as f:
    card = f.read()
card = card.replace(
    "border-[#2563eb] bg-[#121e3d] text-[#dbeafe] shadow-[0_0_20px_rgba(59,91,169,0.25)]",
    "border-cyan-500/60 bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
).replace(
    "border-[#3b5ba9] bg-[#181f33] text-[#d8e2ff]",
    "border-cyan-500/60 bg-cyan-950/20"
)
with open('src/components/ui/Card.tsx', 'w') as f:
    f.write(card)

with open('src/components/ui/Badge.tsx', 'r') as f:
    badge = f.read()
badge = badge.replace(
    "bg-[#1d4ed8] text-[#dbeafe] border border-[#2563eb] shadow-sm",
    "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
).replace(
    "bg-[#2b4578] text-[#d8e2ff] border border-[#3b5ba9]",
    "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50"
)
with open('src/components/ui/Badge.tsx', 'w') as f:
    f.write(badge)

with open('src/components/ui/Button.tsx', 'r') as f:
    btn = f.read()
btn = btn.replace(
    "bg-[#2563eb] hover:bg-[#3b82f6] text-white font-bold shadow-md focus:ring-[#2563eb]/50",
    "bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)] focus:ring-cyan-400/50"
).replace(
    "bg-[#3b5ba9] hover:bg-[#4b6cb9] text-white",
    "bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950"
)
with open('src/components/ui/Button.tsx', 'w') as f:
    f.write(btn)

with open('src/components/ui/Toast.tsx', 'r') as f:
    toast = f.read()
toast = toast.replace(
    "bg-[#121e3d] border-[#2563eb] text-[#dbeafe]",
    "bg-cyan-950/80 border-cyan-500/50 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
).replace(
    "bg-[#181f33] border-[#3b5ba9] text-[#d8e2ff]",
    "bg-cyan-950/80 border-cyan-500/50 text-cyan-200"
)
with open('src/components/ui/Toast.tsx', 'w') as f:
    f.write(toast)

with open('src/components/Logo.tsx', 'r') as f:
    logo = f.read()
logo = logo.replace(
    "bg-[#2563eb]/25 rounded-full blur-xl group-hover:bg-[#2563eb]/45",
    "bg-cyan-400/20 rounded-full blur-xl group-hover:bg-cyan-400/35"
).replace(
    "group-hover:drop-shadow-[0_4px_22px_rgba(37,99,235,0.85)]",
    "group-hover:drop-shadow-[0_4px_22px_rgba(6,182,212,0.85)]"
).replace(
    "group-hover:drop-shadow-[0_4px_22px_rgba(59,91,169,0.85)]",
    "group-hover:drop-shadow-[0_4px_22px_rgba(6,182,212,0.85)]"
)
with open('src/components/Logo.tsx', 'w') as f:
    f.write(logo)

print("Harmonized all UI primitives to Cyber-Glass")
