import { DomainError } from '@/_kernel/DomainError';
import { ErrorCode } from '@/_kernel/ErrorCodes';
import type {
  NotificationPermission,
  NotificationScheduler,
  scheduleInput,
} from '../domain/NotificationScheduler';

/**
 * Doble de `NotificationScheduler`. Guarda lo último programado y cuenta las
 * veces que se pidió permiso, que es lo que hace comprobable la regla de BRD
 * §14 R8: el diálogo se enseña una vez y solo cuando el usuario ha pedido el
 * aviso.
 */
export class InMemoryNotificationScheduler implements NotificationScheduler {
  scheduled?: scheduleInput;
  requests = 0;
  private failing = false;

  static create(permission: NotificationPermission = 'askable'): InMemoryNotificationScheduler {
    return new InMemoryNotificationScheduler(permission);
  }

  constructor(
    private current: NotificationPermission = 'askable',
    /** Lo que contesta el usuario al diálogo del sistema. */
    private answer: NotificationPermission = 'granted',
  ) {}

  /** Como si el usuario lo cambiara desde los ajustes del sistema. */
  grant(permission: NotificationPermission): void {
    this.current = permission;
  }

  /** Qué va a contestar al diálogo la próxima vez que se le enseñe. */
  answers(permission: NotificationPermission): void {
    this.answer = permission;
  }

  /** Como un sistema que no deja programar: el adaptador lanza `DomainError`. */
  failsToSchedule(): void {
    this.failing = true;
  }

  async permission(): Promise<NotificationPermission> {
    return this.current;
  }

  async requestPermission(): Promise<NotificationPermission> {
    this.requests += 1;
    this.current = this.answer;
    return this.current;
  }

  async scheduleDaily(input: scheduleInput): Promise<void> {
    if (this.failing) throw DomainError.withCodes(ErrorCode.NOTIFICATION_FAILED);
    this.scheduled = input;
  }

  async cancelDaily(): Promise<void> {
    this.scheduled = undefined;
  }
}
