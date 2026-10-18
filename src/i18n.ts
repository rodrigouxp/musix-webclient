import { createI18n } from "vue-i18n";

import en from './locales/en_US.json';

const fallbackLocale = 'en_US';

const i18n = createI18n({
  legacy: false,
  locale: fallbackLocale,
  fallbackLocale,
  globalInjection: true,
  messages: {
    en_US: en
  }
});

export function useT(){
    return i18n.global;
}

export default i18n;
