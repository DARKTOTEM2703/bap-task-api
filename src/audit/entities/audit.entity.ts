import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

/**
 * AuditLog Entity
 *
 * Immutable record of all system events for compliance and forensic analysis.
 * Tracks user actions, affected resources, and contextual details with automatic timestamps.
 */
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * User identifier extracted from the 'x-user-id' header.
   * Used to establish accountability for all recorded actions.
   */
  @Column()
  userId: string;

  /**
   * Type of action performed (e.g., CREATE_TASK, UPDATE_TASK, DELETE_TASK).
   * Enables filtering and analysis of specific event types.
   */
  @Column()
  action: string;

  /**
   * Primary key of the resource affected by this action.
   * Enables audit trail reconstruction for specific resources.
   */
  @Column()
  taskId: number;

  /**
   * JSON-serialized contextual information about the action payload.
   * Stores request body or relevant mutation details for comprehensive audit trail.
   */
  @Column({ type: 'json', nullable: true })
  details: Record<string, any> | null;

  /**
   * ISO 8601 timestamp automatically set at record creation.
   * Used for temporal analysis and event sequencing.
   */
  @CreateDateColumn()
  timestamp: Date;
}
