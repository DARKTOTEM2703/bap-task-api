import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs') // Así se llamará la tabla en MySQL
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string; // El 'x-user-id' del header

  @Column()
  action: string; // Ej: 'CREATE', 'UPDATE', 'DELETE'

  @Column()
  taskId: number; // ID de la tarea afectada

  @Column({ type: 'json', nullable: true })
  details: Record<string, any> | null;

  @CreateDateColumn()
  timestamp: Date; // Se llena sola automáticamente
}
