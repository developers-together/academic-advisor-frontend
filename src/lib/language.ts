import dayjs from 'dayjs';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { dirFor, type Language } from '@/lib/i18n/i18n';
import { i18n } from '@/lib/i18n/i18n-instance';

type LanguageState = {
  language: Language;

  languageTouched: boolean;
  setLanguage: (language: Language) => void;
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      languageTouched: false,
      setLanguage: (language) => {
        set({ language, languageTouched: true });
        applyLanguage(language);
      },
    }),
    { name: 'advaisor.language' },
  ),
);

export const applyLanguage = (language: Language) => {
  if (i18n.language !== language) {
    void i18n.changeLanguage(language);
  }
  document.documentElement.lang = language;
  document.documentElement.dir = dirFor(language);
  dayjs.locale(language === 'ar' ? 'ar-latin' : 'en');
};

export const seedLanguageFromProfile = (preference: string | null) => {
  const { language, languageTouched } = useLanguageStore.getState();
  if (languageTouched) {
    return;
  }
  if (preference === 'ar' || preference === 'en') {
    if (language !== preference) {
      useLanguageStore.setState({ language: preference });
      applyLanguage(preference);
    }
  }
};

export const initialLanguage = (): Language => {
  const stored = useLanguageStore.getState().language;
  if (stored === 'ar' || stored === 'en') {
    return stored;
  }
  return navigator.language.startsWith('ar') ? 'ar' : 'en';
};
