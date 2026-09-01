import type { Migration } from '../types';

/**
 * v4: el aviso diario de F8, dentro de la fila única de ajustes.
 *
 * **Tres columnas y no una tabla nueva**: el aviso es una preferencia de este
 * móvil, del mismo tamaño y con la misma vida que el sistema de casas. Una
 * tabla propia habría necesitado su propio `CHECK (id = 1)` para decir lo
 * mismo.
 *
 * **Aditiva y con defecto**, que es lo que la deja pasar por un móvil que ya
 * tiene la fila escrita: sin `DEFAULT`, el `ALTER TABLE` sobre una tabla no
 * vacía falla, y aquí además el defecto es el que manda BRD §14 R8 — apagado.
 * La hora se guarda igual estando apagado, para que encenderlo la semana que
 * viene no olvide la que se eligió.
 */
export const migration004Reminder: Migration = {
  version: 4,
  description: 'Aviso diario',
  async up(db) {
    await db.execAsync(`
      ALTER TABLE preferences ADD COLUMN reminder_enabled INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE preferences ADD COLUMN reminder_hour INTEGER NOT NULL DEFAULT 9;
      ALTER TABLE preferences ADD COLUMN reminder_minute INTEGER NOT NULL DEFAULT 0;
    `);
  },
};
