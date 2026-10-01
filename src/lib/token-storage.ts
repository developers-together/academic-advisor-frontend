const TOKEN_KEY = 'advaisor.token';

const attempt = (operation: () => void): boolean => {
  try {
    operation();
    return true;
  } catch {
    return false;
  }
};

export const tokenStorage = {
  get: (): string | null => {
    let token: string | null = null;
    attempt(() => {
      token = localStorage.getItem(TOKEN_KEY);
    });
    return token;
  },
  set: (token: string): void => {
    attempt(() => localStorage.setItem(TOKEN_KEY, token));
  },
  clear: (): void => {
    attempt(() => localStorage.removeItem(TOKEN_KEY));
  },
};
