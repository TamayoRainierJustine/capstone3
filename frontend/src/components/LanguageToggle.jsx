import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaGlobe } from 'react-icons/fa';

const LanguageToggle = () => {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('language') || i18n.language || 'en';
  });

  useEffect(() => {
    // Ensure language is synced
    const savedLang = localStorage.getItem('language') || 'en';
    if (i18n.language !== savedLang) {
      i18n.changeLanguage(savedLang);
    }
    setCurrentLang(i18n.language || savedLang);
  }, [i18n]);

  const changeLanguage = (lng) => {
    try {
      setCurrentLang(lng);
      i18n.changeLanguage(lng);
      localStorage.setItem('language', lng);
      console.log('Language changed to:', lng);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return (
    <div className="flex items-center gap-2 relative z-10">
      <FaGlobe className="text-gray-600" />
      <select
        value={currentLang}
        onChange={(e) => {
          e.preventDefault();
          e.stopPropagation();
          changeLanguage(e.target.value);
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-sm cursor-pointer hover:border-purple-500 transition-colors"
        style={{
          cursor: 'pointer',
          pointerEvents: 'auto',
          zIndex: 1000,
          position: 'relative'
        }}
      >
        <option value="en">English</option>
        <option value="tl">Tagalog</option>
      </select>
    </div>
  );
};

export default LanguageToggle;

