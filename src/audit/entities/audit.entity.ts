import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

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

    @Column({ type: 'text', nullable: true })
    details: string; // JSON con los datos (opcional)

    @CreateDateColumn()
    timestamp: Date; // Se llena sola automáticamente
}