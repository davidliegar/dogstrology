import { Subscription } from '@/subscription/domain/Subscription';

/**
 * **El límite de mascotas no puede aplicarse solo al alta.**
 *
 * Quien tenía tres y deja de pagar seguiría viendo las tres —el carrusel de
 * Hoy, la lista, el pie de las fichas— y el plan no valdría para nada en media
 * app. El recorte vive en `usePets`, que es por donde pasan todas, y de ahí
 * salen solas las tres consecuencias: Hoy vuelve a ser el día de un perro, la
 * pestaña vuelve a ser su hub y Explorar resalta lo de uno.
 *
 * Aquí se fija la aritmética, que es lo que ese hook aplica.
 */
describe('cuántas mascotas enseña el plan', () => {
  const pets = ['baloo', 'kira', 'nala'];
  const visible = (subscription: Subscription) => pets.slice(0, subscription.petLimit());

  it('sin plan se ve una, y las otras no se borran: dejan de verse', () => {
    expect(visible(Subscription.free())).toEqual(['baloo']);
  });

  it('con Cósmico se ven todas', () => {
    expect(visible(Subscription.premium({ planId: 'annual' }))).toEqual(pets);
  });

  it('y añadir se sigue midiendo con las que hay, no con las que se ven', () => {
    // Si se midiera con las visibles, quien tiene tres y ve una creería que
    // puede añadir la segunda — y toparía con el límite después de rellenar
    // el onboarding entero.
    expect(Subscription.free().canAddPet(pets.length)).toBe(false);
  });
});
