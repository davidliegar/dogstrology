import 'react-native-get-random-values';
import { v7 as uuidv7 } from 'uuid';

/** UUIDv7 generado en dispositivo (BRD §12.2.1) — nunca autoincremental. */
export const generateId = (): string => uuidv7();
