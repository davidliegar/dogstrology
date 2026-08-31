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
    const premium = Subscription.premium({ planId: 'annual' });
    expect(premium.isPremium()).toBe(true);
    expect(premium.canAddPet(37)).toBe(true);
  });

  it('recuerda con qué plan se compró', () => {
    expect(Subscription.premium({ planId: 'monthly' }).planId()).toBe('monthly');
  });

  it('los planes que renuevan dicen cuándo; «Para siempre» no caduca', () => {
    const annual = Subscription.premium({ planId: 'annual', renewsAt: '2027-08-24' });
    expect(annual.renews()).toBe(true);
    expect(annual.renewsAt()).toBe('2027-08-24');

    const lifetime = Subscription.premium({ planId: 'lifetime' });
    expect(lifetime.isPremium()).toBe(true);
    expect(lifetime.renews()).toBe(false);
    expect(lifetime.renewsAt()).toBeUndefined();
  });

  it('una fecha guardada en un vitalicio no se enseña: el plan manda sobre el dato', () => {
    expect(Subscription.premium({ planId: 'lifetime', renewsAt: '2027-08-24' }).renewsAt()).toBeUndefined();
  });

  it('el tier gratuito no renueva nada', () => {
    expect(Subscription.free().renews()).toBe(false);
    expect(Subscription.free().renewsAt()).toBeUndefined();
  });
});
