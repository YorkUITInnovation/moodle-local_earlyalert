import React, { useState, useEffect } from 'react';
import { Volume2, Type, Eye, Palette, Globe, Moon, Sun, Zap } from 'lucide-react';

const AccessibilityPanel = ({ onSettingsChange }) => {
  const [settings, setSettings] = useState({
    highContrast: false,
    largeText: false,
    screenReader: false,
    reducedMotion: false,
    darkMode: false,
    language: 'en',
    voiceEnabled: false,
    keyboardNavigation: true
  });

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load saved accessibility preferences
    const savedSettings = localStorage.getItem('accessibilitySettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      applySettings(parsed);
    }
  }, []);

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('accessibilitySettings', JSON.stringify(newSettings));
    applySettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const applySettings = (settings) => {
    const root = document.documentElement;

    // High contrast mode
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Large text
    if (settings.largeText) {
      root.style.fontSize = '120%';
    } else {
      root.style.fontSize = '100%';
    }

    // Dark mode
    if (settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.style.setProperty('--animation-duration', '0s');
    } else {
      root.style.setProperty('--animation-duration', '0.3s');
    }
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' }
  ];

  const announceChange = (message) => {
    // Announce changes to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  };

  const handleVoiceCommand = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        'Accessibility panel opened. Use tab to navigate through options.'
      );
      speechSynthesis.speak(utterance);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          handleVoiceCommand();
        }}
        className="fixed bottom-6 left-6 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 z-50"
        aria-label="Open accessibility options"
        title="Accessibility Options"
      >
        <Eye className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 bg-white rounded-lg shadow-2xl border border-gray-200 p-6 w-80 z-50 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <Eye className="w-5 h-5 mr-2 text-purple-600" />
          Accessibility
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700 p-1 rounded"
          aria-label="Close accessibility panel"
        >
          ×
        </button>
      </div>

      <div className="space-y-4">
        {/* Visual Settings */}
        <div className="border-b border-gray-200 pb-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Palette className="w-4 h-4 mr-2" />
            Visual
          </h4>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">High Contrast</span>
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={(e) => {
                  updateSetting('highContrast', e.target.checked);
                  announceChange(`High contrast ${e.target.checked ? 'enabled' : 'disabled'}`);
                }}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                aria-describedby="high-contrast-desc"
              />
            </label>
            <p id="high-contrast-desc" className="text-xs text-gray-500">
              Increases color contrast for better visibility
            </p>

            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Large Text</span>
              <input
                type="checkbox"
                checked={settings.largeText}
                onChange={(e) => {
                  updateSetting('largeText', e.target.checked);
                  announceChange(`Large text ${e.target.checked ? 'enabled' : 'disabled'}`);
                }}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700 flex items-center">
                {settings.darkMode ? <Moon className="w-4 h-4 mr-1" /> : <Sun className="w-4 h-4 mr-1" />}
                Dark Mode
              </span>
              <input
                type="checkbox"
                checked={settings.darkMode}
                onChange={(e) => {
                  updateSetting('darkMode', e.target.checked);
                  announceChange(`Dark mode ${e.target.checked ? 'enabled' : 'disabled'}`);
                }}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
            </label>
          </div>
        </div>

        {/* Motion Settings */}
        <div className="border-b border-gray-200 pb-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Zap className="w-4 h-4 mr-2" />
            Motion
          </h4>
          
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Reduce Motion</span>
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(e) => {
                updateSetting('reducedMotion', e.target.checked);
                announceChange(`Reduced motion ${e.target.checked ? 'enabled' : 'disabled'}`);
              }}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              aria-describedby="reduced-motion-desc"
            />
          </label>
          <p id="reduced-motion-desc" className="text-xs text-gray-500 mt-1">
            Minimizes animations and transitions
          </p>
        </div>

        {/* Audio Settings */}
        <div className="border-b border-gray-200 pb-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Volume2 className="w-4 h-4 mr-2" />
            Audio
          </h4>
          
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Voice Announcements</span>
            <input
              type="checkbox"
              checked={settings.voiceEnabled}
              onChange={(e) => {
                updateSetting('voiceEnabled', e.target.checked);
                if (e.target.checked) {
                  const utterance = new SpeechSynthesisUtterance('Voice announcements enabled');
                  speechSynthesis.speak(utterance);
                }
              }}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Screen Reader Support</span>
            <input
              type="checkbox"
              checked={settings.screenReader}
              onChange={(e) => {
                updateSetting('screenReader', e.target.checked);
                announceChange(`Screen reader support ${e.target.checked ? 'optimized' : 'standard'}`);
              }}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
          </label>
        </div>

        {/* Language Settings */}
        <div className="border-b border-gray-200 pb-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Globe className="w-4 h-4 mr-2" />
            Language
          </h4>
          
          <select
            value={settings.language}
            onChange={(e) => {
              updateSetting('language', e.target.value);
              announceChange(`Language changed to ${languages.find(l => l.code === e.target.value)?.name}`);
            }}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="Select language"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Keyboard Navigation */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Type className="w-4 h-4 mr-2" />
            Navigation
          </h4>
          
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Enhanced Keyboard Navigation</span>
            <input
              type="checkbox"
              checked={settings.keyboardNavigation}
              onChange={(e) => {
                updateSetting('keyboardNavigation', e.target.checked);
                announceChange(`Keyboard navigation ${e.target.checked ? 'enhanced' : 'standard'}`);
              }}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Press Tab to navigate, Enter to select, Escape to close modals
          </p>
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setSettings({
                  highContrast: false,
                  largeText: false,
                  screenReader: false,
                  reducedMotion: false,
                  darkMode: false,
                  language: 'en',
                  voiceEnabled: false,
                  keyboardNavigation: true
                });
                localStorage.removeItem('accessibilitySettings');
                applySettings({});
                announceChange('Accessibility settings reset to default');
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm transition-colors"
            >
              Reset
            </button>
            <button
              onClick={() => {
                const helpText = 'Accessibility features: Use high contrast for better visibility, large text for easier reading, voice announcements for audio feedback, and keyboard navigation for screen reader compatibility.';
                if (settings.voiceEnabled && 'speechSynthesis' in window) {
                  const utterance = new SpeechSynthesisUtterance(helpText);
                  speechSynthesis.speak(utterance);
                } else {
                  alert(helpText);
                }
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm transition-colors"
            >
              Help
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add CSS for accessibility features
const AccessibilityStyles = () => (
  <style jsx global>{`
    .high-contrast {
      filter: contrast(150%);
    }
    
    .high-contrast * {
      border-color: #000 !important;
    }
    
    .high-contrast .bg-white {
      background-color: #ffffff !important;
      color: #000000 !important;
    }
    
    .high-contrast .text-gray-600 {
      color: #000000 !important;
    }
    
    .dark {
      background-color: #1a1a1a;
      color: #ffffff;
    }
    
    .dark .bg-white {
      background-color: #2d2d2d !important;
      color: #ffffff !important;
    }
    
    .dark .text-gray-900 {
      color: #ffffff !important;
    }
    
    .dark .border-gray-200 {
      border-color: #404040 !important;
    }
    
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
    
    /* Focus indicators for keyboard navigation */
    .focus\\:ring-purple-500:focus {
      outline: 2px solid #8b5cf6;
      outline-offset: 2px;
    }
    
    /* High contrast focus indicators */
    .high-contrast *:focus {
      outline: 3px solid #000000 !important;
      outline-offset: 2px;
    }
    
    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  `}</style>
);

export default AccessibilityPanel;
export { AccessibilityStyles };
