import { EventEmitter } from 'events';

/**
 * Central event bus for future GARUDA subsystems to subscribe to.
 * Today: pure in-process EventEmitter. Tomorrow: swap to Redis / NATS.
 */
export const eventBus = new EventEmitter();

export type DomainEvent =
  | 'opportunity.created'
  | 'opportunity.stage_changed'
  | 'opportunity.won'
  | 'opportunity.lost'
  | 'task.completed'
  | 'revenue.recorded';

export function emit(event: DomainEvent, payload: Record<string, unknown>) {
  eventBus.emit(event, payload);
}
