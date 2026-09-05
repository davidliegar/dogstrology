import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * **La fila de añadir del hub se pinta con una mascota, se pague o no.**
 *
 * Con un perro la pestaña es el hub (artboard 25) y no la lista, así que esta
 * fila es la única puerta visible a la casa: el carrusel de Hoy, la lista, el
 * pie de las fichas. Lo demás que lleva ahí —la hoja del 26— se abre tocando
 * el nombre, que es un gesto que hay que adivinar.
 *
 * Nació condicionada a `useCanAddPet`, con el argumento de no ofrecer una
 * acción que no se puede completar. **El argumento estaba del revés**: sin
 * plan, quien tiene un perro es exactamente quien topa con el límite, y D19
 * dice que la puerta se pinta donde se topa. El efecto real no era proteger,
 * era que la mitad multimascota de la app fuera invisible justo para quien
 * tendría que pagarla.
 *
 * Es la tercera vez en el mismo día que una puerta se apaga con un argumento
 * razonable y deja algo inalcanzable —la tira de la Luna, la tarjeta del
 * Ascendente, esta fila—, y ninguna de las tres rompe nada al romperse: la
 * pantalla compila, no falla y simplemente no lleva a ningún sitio. Por eso se
 * comprueba en el fuente.
 */

const HUB = resolve(__dirname, '../PetHub.tsx');
const source = () => readFileSync(HUB, 'utf8');

describe('la puerta a la segunda mascota', () => {
  it('se pinta con una mascota, sin preguntar por el plan', () => {
    expect(source()).toContain('{pets?.length === 1 ?');
    expect(source()).not.toContain('canAddPet && pets');
  });

  it('y lo que decide el plan es a dónde lleva, no si se ve', () => {
    expect(source()).toContain("router.push('/onboarding/name')");
    expect(source()).toContain("door: 'add_pet'");
  });
});
