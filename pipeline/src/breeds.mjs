/**
 * breeds.mjs — el catálogo de razas del MVP.
 *
 * Sirve a dos consumidores que no se hablan entre sí, y por eso vive aquí y
 * no en cualquiera de los dos:
 *
 * - **El pipeline** construye con él las claves `breed=<id>;sign=<sign>` del
 *   catálogo inmutable (BRD §7.3.1). Una vez generado el fragmento, ese id
 *   está congelado para siempre: cambiarlo es repagar la categoría entera.
 * - **La app** (F2) lo usa como fuente del selector de raza y para buscar el
 *   fragmento de F6. Espejo en `app/src/pet/ui/breeds.ts`.
 *
 * El `id` va en inglés y en minúscula, como toda clave (D15): el día que la
 * app salga en inglés se traducen las etiquetas y las claves no se tocan.
 *
 * **El criterio de la lista no es la FCI, es el dueño.** La cobertura de los
 * 10 grupos es una restricción, no una cuota: manda la prevalencia real en
 * España, por eso el grupo 2 y el 9 se llevan un tercio de la lista y el 4 se
 * lleva una sola entrada. Y por eso hay dos entradas que la FCI no reconoce —
 * `american-pit-bull-terrier` y los mestizos: el selector tiene que hablar
 * como habla el dueño, no como habla el estándar.
 *
 * Los mestizos van partidos por tamaño porque son ~la mitad de los perros de
 * España y con una sola entrada el contenido solo podría ser vaguedad; el
 * tamaño da material real (energía, ejercicio, instinto de guarda).
 *
 * `fci: null` = no reconocida por la FCI.
 */

export const BREEDS = [
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

export const BREED_LABELS = Object.fromEntries(BREEDS.map((b) => [b.id, b.label]));
