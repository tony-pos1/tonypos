import { create } from 'zustand';
import { translations, TranslationKey } from './translations';
import { Language } from '../types';

interface I18nStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  name: (item: { name_th: string; name_en: string }) => string;
  desc: (item: { description_th?: string; description_en?: string }) => string;
}

const STORAGE_KEY = 'thai_pos_language';
const initialLang: Language = (localStorage.getItem(STORAGE_KEY) as Language) || 'th';

export const useI18n = create<I18nStore>((set, get) => ({
  language: initialLang,
  setLanguage: (lang: Language) => {
    localStorage.setItem(STORAGE_KEY, lang);
    set({ language: lang });
    document.documentElement.lang = lang;
  },
  toggleLanguage: () => {
    const next = get().language === 'th' ? 'en' : 'th';
    localStorage.setItem(STORAGE_KEY, next);
    set({ language: next });
    document.documentElement.lang = next;
  },
  t: (key: TranslationKey, params?: Record<string, string | number>) => {
    const lang = get().language;
    let text: string = translations[lang]?.[key] || translations['en']?.[key] || key;
    if (params) {
      Object.entries(params).forEach(([paramKey, val]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
      });
    }
    return text;
  },
  name: (item: { name_th: string; name_en: string }) => {
    const lang = get().language;
    if (lang === 'th') {
      return item.name_th || item.name_en || '';
    }
    return item.name_en || item.name_th || '';
  },
  desc: (item: { description_th?: string; description_en?: string }) => {
    const lang = get().language;
    if (lang === 'th') {
      return item.description_th || item.description_en || '';
    }
    return item.description_en || item.description_th || '';
  },
}));
