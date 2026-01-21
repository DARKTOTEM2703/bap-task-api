import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

/**
 * Entidad de Registro de Auditoría
 *
 * Registro inmutable de todos los eventos del sistema para cumplimiento normativo y análisis forense.
 * Rastrea acciones de usuario, recursos afectados e información contextual con marcas de tiempo automáticas.
 */
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Identificador del usuario extraído del encabezado 'x-user-id'.
   * Utilizado para establecer responsabilidad de todas las acciones registradas.
   */
  @Column()
  userId: string;

  /**
   * Tipo de acción realizada (p. ej., CREATE_TASK, UPDATE_TASK, DELETE_TASK).
   * Permite filtrado y análisis de tipos de eventos específicos.
   */
  @Column()
  action: string;

  /**
   * Clave primaria del recurso afectado por esta acción.
   * Permite la reconstrucción del rastro de auditoría para recursos específicos.
   */
  @Column()
  taskId: number;

  /**
   * Información contextual serializada a JSON sobre la carga útil de la acción.
   * Almacena el cuerpo de la solicitud o detalles de mutación relevantes para un rastro de auditoría integral.
   */
  @Column({ type: 'json', nullable: true })
  details: Record<string, any> | null;

  /**
   * Marca de tiempo ISO 8601 establecida automáticamente al crear el registro.
   * Utilizado para análisis temporal y secuenciación de eventos.
   */
  @CreateDateColumn()
  timestamp: Date;
}
