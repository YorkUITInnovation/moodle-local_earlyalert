import React, { useState, useEffect } from 'react';
import { Palette, Star, Sparkles, Heart, Zap, Sun, Moon, Eye } from 'lucide-react';

const DynamicThemeEngine = ({ onThemeChange }) => {
  const [currentTheme, setCurrentTheme] = useState('york-classic');
  const [customizations, setCustomizations] = useState({
    primaryColor: '#E31837',
    accentColor: '#1E40AF',
    backgroundPattern: 'none',
    cardStyle: 'elevated',
    animation: 'smooth'
  });

  const themes = {
    'york-classic': {
      name: 'York Classic',
      icon: '🏛️',
      colors: {
        primary: '#E31837',
        secondary: '#1E40AF',
        accent: '#059669',
        background: '#F9FAFB',
        surface: '#FFFFFF'
      },
      description: 'Official York University branding'
    },
    'midnight-professional': {
      name: 'Midnight Professional',
      icon: '🌙',
      colors: {
        primary: '#3B82F6',
        secondary: '#1F2937',
        accent: '#10B981',
        background: '#111827',
        surface: '#1F2937'
      },
      description: 'Dark theme for extended use'
    },
    'ocean-breeze': {
      name: 'Ocean Breeze',
      icon: '🌊',
      colors: {
        primary: '#0EA5E9',
        secondary: '#0284C7',
        accent: '#06B6D4',
        background: '#F0F9FF',
        surface: '#FFFFFF'
      },
      description: 'Calming blue tones'
    },
    'forest-calm': {
      name: 'Forest Calm',
      icon: '🌲',
      colors: {
        primary: '#059669',
        secondary: '#065F46',
        accent: '#10B981',
        background: '#F0FDF4',
        surface: '#FFFFFF'
      },
      description: 'Nature-inspired greens'
    },
    'sunset-energy': {
      name: 'Sunset Energy',
      icon: '🌅',
      colors: {
        primary: '#F59E0B',
        secondary: '#EA580C',
        accent: '#EF4444',
        background: '#FFFBEB',
        surface: '#FFFFFF'
      },
      description: 'Warm and energetic'
    },
    'high-contrast': {
      name: 'High Contrast',
      icon: '👁️',
      colors: {
        primary: '#000000',
        secondary: '#FFFFFF',
        accent: '#FFFF00',
        background: '#FFFFFF',
        surface: '#F3F4F6'
      },
      description: 'Maximum visibility'
    }
  };

  const patterns = [
    { id: 'none', name: 'None', preview: '⬜' },
    { id: 'dots', name: 'Dots', preview: '⚫' },
    { id: 'grid', name: 'Grid', preview: '⬛' },
    { id: 'waves', name: 'Waves', preview: '〰️' },
    { id: 'diagonal', name: 'Diagonal', preview: '🔷' }
  ];

  const cardStyles = [
    { id: 'flat', name: 'Flat', preview: '⬜' },
    { id: 'elevated', name: 'Elevated', preview: '📋' },
    { id: 'glass', name: 'Glass', preview: '🔍' },
    { id: 'neon', name: 'Neon', preview: '✨' }
  ];

  useEffect(() => {
    applyTheme(themes[currentTheme], customizations);
  }, [currentTheme, customizations]);

  const applyTheme = (theme, custom) => {
    const root = document.documentElement;
    
    // Apply theme colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Apply customizations
    root.style.setProperty('--color-primary-custom', custom.primaryColor);
    root.style.setProperty('--color-accent-custom', custom.accentColor);
    
    // Apply patterns and styles
    root.setAttribute('data-pattern', custom.backgroundPattern);
    root.setAttribute('data-card-style', custom.cardStyle);
    root.setAttribute('data-animation', custom.animation);

    // Notify parent component
    onThemeChange?.({ theme, customizations: custom });
  };

  const generateRandomTheme = () => {
    const colors = [
      '#E31837', '#3B82F6', '#059669', '#F59E0B', '#8B5CF6', 
      '#EF4444', '#10B981', '#F97316', '#06B6D4', '#84CC16'
    ];
    
    const randomPrimary = colors[Math.floor(Math.random() * colors.length)];
    const randomAccent = colors[Math.floor(Math.random() * colors.length)];
    
    setCustomizations({
      ...customizations,
      primaryColor: randomPrimary,
      accentColor: randomAccent,
      backgroundPattern: patterns[Math.floor(Math.random() * patterns.length)].id,
      cardStyle: cardStyles[Math.floor(Math.random() * cardStyles.length)].id
    });
  };

  const savePersonalTheme = () => {
    const personalTheme = {
      name: 'My Personal Theme',
      colors: {
        primary: customizations.primaryColor,
        accent: customizations.accentColor,
        // ... other colors based on primary
      },
      customizations
    };
    
    localStorage.setItem('personalTheme', JSON.stringify(personalTheme));
    alert('Personal theme saved! 🎨');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <Palette className="w-5 h-5 mr-2 text-purple-600" />
          Theme Customization
        </h3>
        <button
          onClick={generateRandomTheme}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-300 transform hover:scale-105"
        >
          <Sparkles className="w-4 h-4" />
          <span>Surprise Me!</span>
        </button>
      </div>

      {/* Theme Presets */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Choose a Theme</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(themes).map(([key, theme]) => (
            <button
              key={key}
              onClick={() => setCurrentTheme(key)}
              className={`relative p-4 rounded-lg border-2 transition-all duration-300 transform hover:scale-105 ${
                currentTheme === key 
                  ? 'border-purple-500 bg-purple-50 scale-105' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{theme.icon}</div>
                <div className="font-medium text-sm">{theme.name}</div>
                <div className="text-xs text-gray-500 mt-1">{theme.description}</div>
                
                {/* Color Preview */}
                <div className="flex justify-center space-x-1 mt-2">
                  <div 
                    className="w-3 h-3 rounded-full border border-gray-300"
                    style={{ backgroundColor: theme.colors.primary }}
                  ></div>
                  <div 
                    className="w-3 h-3 rounded-full border border-gray-300"
                    style={{ backgroundColor: theme.colors.secondary }}
                  ></div>
                  <div 
                    className="w-3 h-3 rounded-full border border-gray-300"
                    style={{ backgroundColor: theme.colors.accent }}
                  ></div>
                </div>
              </div>
              
              {currentTheme === key && (
                <div className="absolute -top-2 -right-2 bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                  ✓
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Colors */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Custom Colors</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">Primary Color</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={customizations.primaryColor}
                onChange={(e) => setCustomizations({
                  ...customizations,
                  primaryColor: e.target.value
                })}
                className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={customizations.primaryColor}
                onChange={(e) => setCustomizations({
                  ...customizations,
                  primaryColor: e.target.value
                })}
                className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                placeholder="#E31837"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-700 mb-2">Accent Color</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={customizations.accentColor}
                onChange={(e) => setCustomizations({
                  ...customizations,
                  accentColor: e.target.value
                })}
                className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={customizations.accentColor}
                onChange={(e) => setCustomizations({
                  ...customizations,
                  accentColor: e.target.value
                })}
                className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                placeholder="#1E40AF"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pattern Selection */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Background Pattern</h4>
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {patterns.map((pattern) => (
            <button
              key={pattern.id}
              onClick={() => setCustomizations({
                ...customizations,
                backgroundPattern: pattern.id
              })}
              className={`flex-shrink-0 p-3 rounded-lg border transition-all ${
                customizations.backgroundPattern === pattern.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-xl mb-1">{pattern.preview}</div>
              <div className="text-xs">{pattern.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Card Style */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Card Style</h4>
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {cardStyles.map((style) => (
            <button
              key={style.id}
              onClick={() => setCustomizations({
                ...customizations,
                cardStyle: style.id
              })}
              className={`flex-shrink-0 p-3 rounded-lg border transition-all ${
                customizations.cardStyle === style.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-xl mb-1">{style.preview}</div>
              <div className="text-xs">{style.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Animation Preferences */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Animation Style</h4>
        <select
          value={customizations.animation}
          onChange={(e) => setCustomizations({
            ...customizations,
            animation: e.target.value
          })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="smooth">Smooth & Fluid</option>
          <option value="bouncy">Bouncy & Playful</option>
          <option value="minimal">Minimal Motion</option>
          <option value="none">No Animation</option>
        </select>
      </div>

      {/* Preview */}
      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-3">Theme Preview</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: customizations.primaryColor,
              color: 'white'
            }}
          >
            <div className="font-semibold">Primary Color</div>
            <div className="text-sm opacity-90">Dashboard headers and buttons</div>
          </div>
          
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: customizations.accentColor,
              color: 'white'
            }}
          >
            <div className="font-semibold">Accent Color</div>
            <div className="text-sm opacity-90">Links and highlights</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-3 pt-4 border-t">
        <button
          onClick={savePersonalTheme}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
        >
          <Heart className="w-4 h-4" />
          <span>Save Personal Theme</span>
        </button>
        
        <button
          onClick={() => {
            setCurrentTheme('york-classic');
            setCustomizations({
              primaryColor: '#E31837',
              accentColor: '#1E40AF',
              backgroundPattern: 'none',
              cardStyle: 'elevated',
              animation: 'smooth'
            });
          }}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default DynamicThemeEngine;
