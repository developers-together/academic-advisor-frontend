import { createI18n, type resources } from './i18n';

export const i18n = createI18n();

export type I18nResources = typeof resources;
