import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Enumeración de Estados de Tarea
 *
 * Define los estados del ciclo de vida para la gestión de tareas.
 * - OPEN: Estado inicial
 * - PENDING: Tarea en cola esperando ejecución
 * - IN_PROGRESS: Tarea se está siendo trabajada actualmente
 * - DONE: Tarea ha sido completada
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

  @Column({ type: 'datetime' })
  deliveryDate: Date;

  @Column({ nullable: true })
  comments: string;

  @Column({ nullable: true })
  responsible: string;

  /**
   * Array de etiquetas para categorización y filtrado de tareas.
   * Utiliza el tipo de columna simple-array para almacenamiento separado por comas.
   */
  @Column('simple-array', { nullable: true })
  tags: string[];

  /**
   * Bandera de visibilidad que determina la accesibilidad de la tarea.
   * Cuando es verdadero, la tarea es visible para todos los usuarios; cuando es falso, solo es visible para el propietario.
   * Requerido para implementación de control de acceso basado en roles (requisito opcional).
   */
  @Column({ default: false })
  isPublic: boolean;

  /**
   * Identificador del usuario que establece la propiedad de la tarea.
   * Extraído del encabezado 'x-user-id' para aplicar autorización a nivel de recurso.
   */
  @Column()
  userId: string;

  /**
   * URL pública del archivo adjunto (opcional).
   * Almacenado en MinIO/S3.
   * Formatos permitidos: PDF, PNG, JPG. Máximo 5MB.
   */
  @Column({ nullable: true })
  fileUrl?: string;

  /**
   * Nombre original del archivo subido.
   */
  @Column({ nullable: true })
  fileName?: string;

  /**
   * Ruta del archivo en MinIO para gestión interna.
   */
  @Column({ nullable: true })
  fileKey?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
