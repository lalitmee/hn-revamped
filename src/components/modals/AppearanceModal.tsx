'use client';

import React, { useState } from 'react';
import { FontFamilyId, LineWidthOption, ThemeId, UserPreferences } from '@/types/hn';
import { FONT_FAMILIES, THEMES } from '@/lib/themes';

interface AppearanceModalProps {
  isOpen: boolean;
  preferences: UserPreferences;
  onUpdate: (prefs: UserPreferences) => void;
  onClose: () => void;
}

export const AppearanceModal: React.FC<AppearanceModalProps> = ({
  isOpen,
  preferences,
  onUpdate,
  onClose,
}) => {
  const [keywordInput, setKeywordInput] = useState('');

  if (!isOpen) return null;

  const readerThemes = Object.values(THEMES).filter((t) => t.category === 'reader');
  const codeThemes = Object.values(THEMES).filter((t) => t.category === 'code');

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-surface-1)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
        className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl border p-6 shadow-2xl space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--accent)' }} className="material-symbols-rounded">
              palette
            </span>
            <h2 className="text-lg font-bold">Theme, Typography &amp; Filter Studio</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 cursor-pointer"
          >
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        {/* E-Book & Reader Themes */}
        <div>
          <h3
            style={{ color: 'var(--text-muted)' }}
            className="text-xs font-bold uppercase tracking-wider mb-3"
          >
            E-Book &amp; Editorial Reader Themes (Kindle / Instapaper / Material)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {readerThemes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onUpdate({ ...preferences, themeId: t.id as ThemeId })}
                style={{
                  backgroundColor: t.colors.bgCanvas,
                  color: t.colors.textPrimary,
                  borderColor:
                    preferences.themeId === t.id ? t.colors.accent : t.colors.borderSubtle,
                }}
                className="p-3 rounded-2xl border-2 text-left cursor-pointer transition hover:scale-[1.01]"
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>{t.name}</span>
                  {preferences.themeId === t.id && (
                    <span style={{ color: t.colors.accent }}>●</span>
                  )}
                </div>
                <div style={{ color: t.colors.textMuted }} className="text-[10px] mt-1">
                  {t.inspiration}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Code Editor Themes */}
        <div>
          <h3
            style={{ color: 'var(--text-muted)' }}
            className="text-xs font-bold uppercase tracking-wider mb-3"
          >
            Developer &amp; Code Editor Themes
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {codeThemes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onUpdate({ ...preferences, themeId: t.id as ThemeId })}
                style={{
                  backgroundColor: t.colors.bgCanvas,
                  color: t.colors.textPrimary,
                  borderColor:
                    preferences.themeId === t.id ? t.colors.accent : t.colors.borderSubtle,
                }}
                className="p-3 rounded-2xl border-2 text-left cursor-pointer transition hover:scale-[1.01]"
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>{t.name}</span>
                  {preferences.themeId === t.id && (
                    <span style={{ color: t.colors.accent }}>●</span>
                  )}
                </div>
                <div style={{ color: t.colors.textMuted }} className="text-[10px] mt-1">
                  {t.inspiration}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Font Family & Size */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              style={{ color: 'var(--text-muted)' }}
              className="block text-xs font-bold uppercase tracking-wider mb-2"
            >
              Font Family
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(FONT_FAMILIES) as FontFamilyId[]).map((fid) => (
                <button
                  key={fid}
                  type="button"
                  onClick={() => onUpdate({ ...preferences, fontFamily: fid })}
                  style={{
                    backgroundColor:
                      preferences.fontFamily === fid
                        ? 'var(--bg-surface-active)'
                        : 'var(--bg-surface-2)',
                    borderColor:
                      preferences.fontFamily === fid ? 'var(--accent)' : 'var(--border-subtle)',
                  }}
                  className="px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
                >
                  {FONT_FAMILIES[fid].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              style={{ color: 'var(--text-muted)' }}
              className="block text-xs font-bold uppercase tracking-wider mb-2"
            >
              Reading Font Size ({preferences.fontSize}px) &amp; Measure
            </label>
            <input
              type="range"
              min={14}
              max={22}
              value={preferences.fontSize}
              onChange={(e) =>
                onUpdate({ ...preferences, fontSize: Number(e.target.value) })
              }
              className="w-full accent-orange-500 mb-3"
            />
            <div className="flex gap-1.5">
              {(['55ch', '65ch', '75ch', 'full'] as LineWidthOption[]).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => onUpdate({ ...preferences, lineWidth: w })}
                  style={{
                    backgroundColor:
                      preferences.lineWidth === w ? 'var(--accent)' : 'var(--bg-surface-2)',
                    color: preferences.lineWidth === w ? '#fff' : 'var(--text-secondary)',
                  }}
                  className="flex-1 py-1 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feed Filtering & Muted Keywords */}
        <div
          style={{ borderColor: 'var(--border-subtle)' }}
          className="pt-4 border-t space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Auto-hide already read stories</span>
            <input
              type="checkbox"
              checked={preferences.hideReadStories}
              onChange={(e) =>
                onUpdate({ ...preferences, hideReadStories: e.target.checked })
              }
              className="h-4 w-4 accent-orange-500"
            />
          </div>

          <div>
            <label
              style={{ color: 'var(--text-muted)' }}
              className="block text-xs font-bold uppercase tracking-wider mb-2"
            >
              Muted Keywords (Hide matching titles)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Add keyword to mute..."
                style={{
                  backgroundColor: 'var(--bg-surface-2)',
                  borderColor: 'var(--border-subtle)',
                }}
                className="flex-1 px-3 py-1.5 rounded-xl border text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  const clean = keywordInput.trim();
                  if (clean && !preferences.mutedKeywords.includes(clean)) {
                    onUpdate({
                      ...preferences,
                      mutedKeywords: [...preferences.mutedKeywords, clean],
                    });
                    setKeywordInput('');
                  }
                }}
                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                className="px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Add
              </button>
            </div>
            {preferences.mutedKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {preferences.mutedKeywords.map((kw) => (
                  <span
                    key={kw}
                    style={{ backgroundColor: 'var(--bg-surface-2)' }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
                  >
                    {kw}
                    <button
                      type="button"
                      onClick={() =>
                        onUpdate({
                          ...preferences,
                          mutedKeywords: preferences.mutedKeywords.filter((k) => k !== kw),
                        })
                      }
                      className="material-symbols-rounded text-[14px] cursor-pointer"
                    >
                      close
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
