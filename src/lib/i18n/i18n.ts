import i18next, { type i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import arAdmin from './locales/ar/admin.json';
import arAdvisor from './locales/ar/advisor.json';
import arAuth from './locales/ar/auth.json';
import arChat from './locales/ar/chat.json';
import arCommon from './locales/ar/common.json';
import arGovernance from './locales/ar/governance.json';
import arNotifications from './locales/ar/notifications.json';
import arPlan from './locales/ar/plan.json';
import arRules from './locales/ar/rules.json';
import enAdmin from './locales/en/admin.json';
import enAdvisor from './locales/en/advisor.json';
import enAuth from './locales/en/auth.json';
import enChat from './locales/en/chat.json';
import enCommon from './locales/en/common.json';
import enGovernance from './locales/en/governance.json';
import enNotifications from './locales/en/notifications.json';
import enPlan from './locales/en/plan.json';
import enRules from './locales/en/rules.json';

export const namespaces = [
  'common',
  'auth',
  'plan',
  'chat',
  'advisor',
  'governance',
  'admin',
  'notifications',
  'rules',
] as const;

export const supportedLanguages = ['en', 'ar'] as const;
export type Language = (typeof supportedLanguages)[number];

export const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    plan: enPlan,
    chat: enChat,
    advisor: enAdvisor,
    governance: enGovernance,
    admin: enAdmin,
    notifications: enNotifications,
    rules: enRules,
  },
  ar: {
    common: arCommon,
    auth: arAuth,
    plan: arPlan,
    chat: arChat,
    advisor: arAdvisor,
    governance: arGovernance,
    admin: arAdmin,
    notifications: arNotifications,
    rules: arRules,
  },
} as const;

export const dirFor = (language: Language): 'ltr' | 'rtl' =>
  language === 'ar' ? 'rtl' : 'ltr';

export const createI18n = (): I18nInstance => {
  const instance = i18next.createInstance();

  void instance.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: [...supportedLanguages],
    defaultNS: 'common',
    ns: [...namespaces],
    interpolation: { escapeValue: false },
    returnNull: false,
    react: { useSuspense: false },
  });

  return instance;
};
