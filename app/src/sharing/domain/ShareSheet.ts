export interface shareInput {
  /** El PNG ya codificado en base64, sin la cabecera de `data:`. */
  png: string;
  /**
   * Cómo se va a llamar el fichero donde acabe. Lo lee el destino —el nombre
   * que enseña Fotos, o el del adjunto en un correo—, así que es texto para una
   * persona y lo pone la UI.
   */
  name: string;
}

/**
 * Puerto de compartir. Detrás va la hoja del sistema, y por eso el dominio no
 * sabe que existen los ficheros: **entrega bytes y un nombre**, no una ruta.
 * Dónde se guarda el PNG mientras el sistema lo lee es cosa del adaptador.
 *
 * `isAvailable()` existe porque no siempre se puede: en un Android sin ninguna
 * app que acepte imágenes, la hoja no abre. Se pregunta antes para no ofrecer
 * un botón que no lleva a nada.
 *
 * **Cerrar la hoja sin elegir destino no es un fallo.** Ni Android ni iOS lo
 * distinguen de haber compartido, así que `share` resuelve igual en los dos
 * casos y nadie se inventa un error que no ha ocurrido.
 */
export interface ShareSheet {
  isAvailable(): Promise<boolean>;
  share(input: shareInput): Promise<void>;
}
