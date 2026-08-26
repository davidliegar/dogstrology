/**
 * breeds.ts — el catálogo de razas del MVP.
 *
 * Espejo de `pipeline/src/breeds.mjs`. Los dos ficheros no se importan entre
 * sí (uno es TS de la app, el otro .mjs del pipeline) y por eso hay un test a
 * cada lado que los ata: si divergen, el pipeline generaría el fragmento con
 * una clave y la app buscaría otra. Eso **no falla** — la ficha de raza sale
 * vacía y nadie se entera (BRD §7.3.1).
 *
 * El `id` es la clave del contenido y va en inglés (D15); el `label` es lo
 * único que ve el usuario. Fuente del selector de F2 y de la clave
 * `breed=<id>;sign=<sign>` que F6 usa para buscar su fragmento.
 */

export type Breed = {
  /** Clave del catálogo. Congelada: cambiarla obliga a regenerar la categoría. */
  readonly id: string;
  /** Lo que se enseña en el selector. */
  readonly label: string;
  /** Grupo FCI, o `null` si la FCI no la reconoce (pitbull, mestizos). */
  readonly fci: number | null;
};

export const BREEDS: readonly Breed[] = [
  // Grupo 1 — Perros de pastor y boyeros
  { id: 'german-shepherd', label: 'Pastor alemán', fci: 1 },
  { id: 'border-collie', label: 'Border collie', fci: 1 },
  { id: 'australian-shepherd', label: 'Pastor australiano', fci: 1 },
  { id: 'belgian-malinois', label: 'Pastor belga malinois', fci: 1 },
  { id: 'rough-collie', label: 'Collie de pelo largo', fci: 1 },
  { id: 'welsh-corgi-pembroke', label: 'Welsh corgi pembroke', fci: 1 },

  // Grupo 2 — Pinscher, schnauzer, molosoides y boyeros suizos
  { id: 'french-bulldog', label: 'Bulldog francés', fci: 2 },
  { id: 'english-bulldog', label: 'Bulldog inglés', fci: 2 },
  { id: 'miniature-schnauzer', label: 'Schnauzer miniatura', fci: 2 },
  { id: 'boxer', label: 'Bóxer', fci: 2 },
  { id: 'rottweiler', label: 'Rottweiler', fci: 2 },
  { id: 'dobermann', label: 'Dóberman', fci: 2 },
  { id: 'cane-corso', label: 'Cane corso', fci: 2 },
  { id: 'presa-canario', label: 'Presa canario', fci: 2 },
  { id: 'dogo-argentino', label: 'Dogo argentino', fci: 2 },
  { id: 'spanish-mastiff', label: 'Mastín español', fci: 2 },
  { id: 'bernese-mountain-dog', label: 'Boyero de Berna', fci: 2 },
  { id: 'shar-pei', label: 'Shar pei', fci: 2 },
  { id: 'ca-de-bou', label: 'Ca de bou', fci: 2 },

  // Grupo 3 — Terriers
  { id: 'yorkshire-terrier', label: 'Yorkshire terrier', fci: 3 },
  { id: 'jack-russell-terrier', label: 'Jack Russell terrier', fci: 3 },
  { id: 'west-highland-white-terrier', label: 'West highland white terrier', fci: 3 },
  { id: 'american-staffordshire-terrier', label: 'American staffordshire terrier', fci: 3 },
  { id: 'staffordshire-bull-terrier', label: 'Staffordshire bull terrier', fci: 3 },
  { id: 'bull-terrier', label: 'Bull terrier', fci: 3 },
  { id: 'fox-terrier', label: 'Fox terrier', fci: 3 },
  { id: 'andalusian-ratonero', label: 'Ratonero bodeguero andaluz', fci: 3 },

  // Grupo 4 — Teckels
  { id: 'dachshund', label: 'Teckel', fci: 4 },

  // Grupo 5 — Spitz y tipo primitivo
  { id: 'siberian-husky', label: 'Husky siberiano', fci: 5 },
  { id: 'alaskan-malamute', label: 'Malamute de Alaska', fci: 5 },
  { id: 'samoyed', label: 'Samoyedo', fci: 5 },
  { id: 'pomeranian', label: 'Pomerania', fci: 5 },
  { id: 'shiba-inu', label: 'Shiba inu', fci: 5 },
  { id: 'akita-inu', label: 'Akita inu', fci: 5 },
  { id: 'podenco', label: 'Podenco', fci: 5 },

  // Grupo 6 — Sabuesos y razas semejantes
  { id: 'beagle', label: 'Beagle', fci: 6 },
  { id: 'basset-hound', label: 'Basset hound', fci: 6 },
  { id: 'dalmatian', label: 'Dálmata', fci: 6 },

  // Grupo 7 — Perros de muestra
  { id: 'brittany', label: 'Bretón', fci: 7 },
  { id: 'english-setter', label: 'Setter inglés', fci: 7 },
  { id: 'weimaraner', label: 'Braco de Weimar', fci: 7 },
  { id: 'german-shorthaired-pointer', label: 'Braco alemán', fci: 7 },

  // Grupo 8 — Cobradores, levantadores y perros de agua
  { id: 'labrador-retriever', label: 'Labrador retriever', fci: 8 },
  { id: 'golden-retriever', label: 'Golden retriever', fci: 8 },
  { id: 'english-cocker-spaniel', label: 'Cocker spaniel inglés', fci: 8 },
  { id: 'english-springer-spaniel', label: 'Springer spaniel inglés', fci: 8 },
  { id: 'spanish-water-dog', label: 'Perro de agua español', fci: 8 },

  // Grupo 9 — Perros de compañía
  { id: 'chihuahua', label: 'Chihuahua', fci: 9 },
  { id: 'pug', label: 'Carlino', fci: 9 },
  { id: 'shih-tzu', label: 'Shih tzu', fci: 9 },
  { id: 'maltese', label: 'Bichón maltés', fci: 9 },
  { id: 'bichon-frise', label: 'Bichón frisé', fci: 9 },
  { id: 'poodle', label: 'Caniche', fci: 9 },
  { id: 'cavalier-king-charles-spaniel', label: 'Cavalier king charles spaniel', fci: 9 },
  { id: 'lhasa-apso', label: 'Lhasa apso', fci: 9 },
  { id: 'pekingese', label: 'Pequinés', fci: 9 },
  { id: 'papillon', label: 'Papillón', fci: 9 },
  { id: 'boston-terrier', label: 'Boston terrier', fci: 9 },

  // Grupo 10 — Lebreles
  { id: 'spanish-greyhound', label: 'Galgo español', fci: 10 },
  { id: 'greyhound', label: 'Galgo inglés', fci: 10 },
  { id: 'whippet', label: 'Whippet', fci: 10 },

  // Sin reconocimiento FCI, pero es como se llaman a sí mismos los perros que
  // hay en la calle y en las protectoras de España.
  { id: 'american-pit-bull-terrier', label: 'Pitbull', fci: null },
  { id: 'mixed-breed-small', label: 'Mestizo pequeño', fci: null },
  { id: 'mixed-breed-medium', label: 'Mestizo mediano', fci: null },
  { id: 'mixed-breed-large', label: 'Mestizo grande', fci: null },
];

export const BREED_LABELS: Record<string, string> = Object.fromEntries(
  BREEDS.map((b) => [b.id, b.label]),
);
