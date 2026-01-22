import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Entidad de Usuario
 *
 * Representa un usuario del sistema con credenciales de autenticación.
 * Utilizada para JWT, control de acceso a tareas y registros de auditoría.
 * Las contraseñas se almacenan hasheadas con bcrypt (10 rounds).
 */
@Entity('users')
export class User {
  /**
   * Identificador único UUID v4
   * Generado automáticamente por la base de datos
   * Utilizado en tokens JWT y relaciones de tareas
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Dirección de correo electrónico única
   * Utilizada para login y como identificador de usuario
   * Restricción UNIQUE a nivel de base de datos
   */
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  /**
   * Contraseña hasheada con bcrypt
   * NUNCA se debe exponer en respuestas de API
   * Se valida comparando hash durante el login
   */
  @Column({ type: 'varchar', length: 255 })
  password: string;

  /**
   * Nombre completo del usuario
   * Se muestra en la interfaz y registros de auditoría
   */
  @Column({ type: 'varchar', length: 255 })
  name: string;

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
