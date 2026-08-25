/**
 * Grado dentro del signo como `22°14′`, la convención de efemérides.
 *
 * El motor devuelve un decimal (22,233…); enseñarlo así sería preciso y
 * ilegible. Los minutos se truncan, no se redondean: `29°59,7′` debe seguir
 * leyéndose como 29°59′ del mismo signo y no saltar a 30° del siguiente.
 */
export function formatDegree(degree: number): string {
  const whole = Math.floor(degree);
  const minutes = Math.floor((degree - whole) * 60);
  return `${whole}°${String(minutes).padStart(2, '0')}′`;
}
