export type StoryTheme = 'light' | 'dark';
export type StoryDirection = 'ltr' | 'rtl';

export const applyStoryCanvas = (
  theme: StoryTheme,
  direction: StoryDirection,
) => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.lang = direction === 'rtl' ? 'ar' : 'en';
  document.documentElement.dir = direction;
};
