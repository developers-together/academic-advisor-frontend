import { env } from '@/config/env';

export const enableMocking = async () => {
  if (import.meta.env.DEV && env.ENABLE_API_MOCKING) {
    const { worker } = await import('./browser');
    const { setScenario, scenarios } = await import('./scenarios');

    const url = new URL(window.location.href);
    const requested = url.searchParams.get('scenario');
    const stored = window.sessionStorage.getItem('advaisor.scenario') as
      (typeof scenarios)[number] | null;
    const scenario =
      requested && scenarios.includes(requested as never)
        ? (requested as (typeof scenarios)[number])
        : stored && scenarios.includes(stored)
          ? stored
          : undefined;

    if (scenario) {
      window.sessionStorage.setItem('advaisor.scenario', scenario);
      if (requested) {
        url.searchParams.delete('scenario');
        window.history.replaceState({}, '', url.toString());
      }
    }

    setScenario(scenario ?? 'happy');

    return worker.start({
      onUnhandledRequest: 'bypass',
    });
  }
};
