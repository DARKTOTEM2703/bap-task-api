import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * TaskStatus Enumeration
 *
 * Defines the lifecycle states for task management.
 * - OPEN: Initial state
 * - PENDING: Task is queued and awaiting execution
 * - IN_PROGRESS: Task is currently being worked on
 * - DONE: Task has been completed
 */
export enum TaskStatus {
  OPEN = 'OPEN',
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @Column({ type: 'date' })
  deliveryDate: Date;

  @Column({ nullable: true })
  comments: string;

  @Column({ nullable: true })
  responsible: string;

  /**
   * Array of tags for task categorization and filtering.
   * Uses simple-array column type for comma-separated storage.
   */
  @Column('simple-array', { nullable: true })
  tags: string[];

  /**
   * Visibility flag determining task accessibility.
   * When true, task is visible to all users; when false, only visible to task owner.
   * Required for role-based access control implementation (Optional requirement).
   */
  @Column({ default: false })
  isPublic: boolean;

  /**
   * User identifier that establishes task ownership.
   * Extracted from 'x-user-id' header to enforce resource-level authorization.
   */
  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/*Este archivo define la entidad Task para la base de datos, 
incluyendo campos como título, descripción, estado, fecha de entrega, 
comentarios, responsable, etiquetas, visibilidad pública, 
y el ID del usuario propietario. También incluye marcas de tiempo 
para creación y actualización. */
