import { FREE_PET_LIMIT, Subscription } from '../Subscription';

describe('Subscription', () => {
  it('quien no ha comprado nunca no es un dato que falte: es el tier gratuito', () => {
    const free = Subscription.free();
    expect(free.isPremium()).toBe(false);
    expect(free.planId()).toBeUndefined();
  });

  it('el tier gratuito llega hasta una mascota (BRD §10.3)', () => {
    const free = Subscription.free();
    expect(free.petLimit()).toBe(FREE_PET_LIMIT);
    expect(free.canAddPet(0)).toBe(true);
    expect(free.canAddPet(1)).toBe(false);
  });

  it('premium no tiene tope de mascotas', () => {
    const premium = Subscription.premium('annual');
    expect(premium.isPremium()).toBe(true);
    expect(premium.canAddPet(37)).toBe(true);
  });

  it('recuerda con qué plan se compró', () => {
    expect(Subscription.premium('monthly').planId()).toBe('monthly');
  });
});
