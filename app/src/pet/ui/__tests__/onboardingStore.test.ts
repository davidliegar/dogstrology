import { accuracyFor, useOnboardingStore } from '../onboardingStore';

describe('estado efímero del onboarding', () => {
  beforeEach(() => useOnboardingStore.getState().reset());

  it('acumula lo que el usuario va rellenando entre pantallas', () => {
    useOnboardingStore.getState().setName('Baloo');
    useOnboardingStore.getState().setBirthDate('2025-12-14');

    expect(useOnboardingStore.getState().name).toBe('Baloo');
    expect(useOnboardingStore.getState().birthDate).toBe('2025-12-14');
  });

  it('reset() lo vacía del todo al acabar el wizard', () => {
    // A partir de la revelación la verdad es el repositorio, no esto: si algo
    // sobreviviera aquí, la segunda mascota arrancaría con datos de la primera.
    useOnboardingStore.getState().setName('Baloo');
    useOnboardingStore.getState().setDateIsApproximate(true);

    useOnboardingStore.getState().reset();

    expect(useOnboardingStore.getState()).toMatchObject({
      name: '',
      birthDate: '',
      dateIsApproximate: false,
    });
  });
});

describe('accuracyFor', () => {
  it('traduce la casilla "no sé la fecha exacta" a la precisión del dominio', () => {
    // BRD §12.3: la precisión es lo que luego degrada la carta.
    expect(accuracyFor(false)).toBe('exact');
    expect(accuracyFor(true)).toBe('approx');
  });
});
