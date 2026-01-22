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
 * - OPEN: Tarea recién creada, estado inicial
 * - PENDING: Tarea en cola esperando asignación o ejecución
 * - IN_PROGRESS: Tarea actualmente siendo trabajada
 * - DONE: Tarea completada y finalizada
 */
export enum TaskStatus {
  OPEN = 'OPEN',
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

/**
 * Entidad de Tarea
 *
 * Representa una tarea del sistema con toda su información asociada.
 * Soporta tareas públicas/privadas, archivos adjuntos, tags y auditoría completa.
 * Implementa control de acceso basado en propiedad (userId) y visibilidad (isPublic).
 */
@Entity('tasks')
export class Task {
  /**
   * Identificador único autoincremental
   * Clave primaria de la tabla
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Título descriptivo de la tarea
   * Entre 3 y 200 caracteres según validación del DTO
   */
  @Column()
  title: string;

  /**
   * Descripción detallada de la tarea
   * Entre 10 y 2000 caracteres según validación del DTO
   * Incluye instrucciones y contexto completo
   */
  @Column()
  description: string;

  /**
   * Estado actual del ciclo de vida de la tarea
   * Utiliza enum TaskStatus con valor por defecto PENDING
   * Almacenado como ENUM en la base de datos
   */
  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status: TaskStatus;

  /**
   * Fecha y hora límite para completar la tarea
   * Formato datetime de MySQL
   * Nullable si no se especifica un deadline
   */
  @Column({ type: 'datetime', nullable: true })
  deliveryDate: Date;

  /**
   * Comentarios adicionales o notas sobre la tarea
   * Campo de texto libre con máximo 1000 caracteres
   * Opcional, puede ser null
   */
  @Column({ nullable: true })
  comments: string;

  /**
   * Nombre de la persona asignada como responsable
   * Máximo 100 caracteres
   * Opcional, puede ser null
   */
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
   * URL pública del archivo adjunto (opcional)
   * Almacenado en MinIO/S3 compatible
   * Formatos permitidos: PDF, PNG, JPG
   * Tamaño máximo: 5MB
   * Ejemplo: http://localhost:9000/tasks/task-123-1234567890.pdf
   */
  @Column({ nullable: true })
  fileUrl?: string;

  /**
   * Nombre original del archivo subido por el usuario
   * Preserva el nombre original para referencia
   * Ejemplo: "documento-requisitos.pdf"
   */
  @Column({ nullable: true })
  fileName?: string;

  /**
   * Clave/path del archivo en el bucket de MinIO
   * Utilizado internamente para operaciones de eliminación
   * Formato: task-{taskId}-{timestamp}.{extension}
   */
  @Column({ nullable: true })
  fileKey?: string;

  /**
   * Fecha y hora de creación del registro
   * Establecida automáticamente por TypeORM al insertar
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Fecha y hora de última actualización del registro
   * Actualizada automáticamente por TypeORM en cada modificación
   */
  @UpdateDateColumn()
  updatedAt: Date;
}
