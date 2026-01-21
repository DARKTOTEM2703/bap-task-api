import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @Column('simple-array', { nullable: true })
  tags: string[];

  // --- RETO EXTRA ---
  @Column({ default: false })
  isPublic: boolean;

  @Column()
  userId: string; // El dueño de la tarea
  // ------------------

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
