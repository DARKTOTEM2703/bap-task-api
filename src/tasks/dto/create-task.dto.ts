import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  IsArray,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '../entities/task.entity';

/**
 * DTO para crear una nueva tarea
 *
 * Todos los campos requeridos deben ser proporcionados.
 * Campos opcionales pueden omitirse.
 */
export class CreateTaskDto {
  /**
   * Título de la tarea (requerido)
   * Debe tener entre 3 y 200 caracteres
   * Aparecerá en listados y búsquedas
   */
  @ApiProperty({
    description: 'Título descriptivo de la tarea',
    example: 'Terminar documentación del API',
    type: String,
    minLength: 3,
    maxLength: 200,
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'El título es requerido' })
  @MinLength(3, { message: 'El título debe tener al menos 3 caracteres' })
  @MaxLength(200, { message: 'El título no puede exceder 200 caracteres' })
  title: string;

  /**
   * Descripción de la tarea (requerida)
   * Debe tener entre 10 y 2000 caracteres
   * Incluye detalles completos sobre qué se debe hacer
   */
  @ApiProperty({
    description:
      'Descripción detallada de la tarea con instrucciones específicas',
    example:
      'Completar toda la documentación del API incluyendo ejemplos de uso, casos de error y mejores prácticas',
    type: String,
    minLength: 10,
    maxLength: 2000,
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'La descripción es requerida' })
  @MinLength(10, {
    message: 'La descripción debe tener al menos 10 caracteres',
  })
  @MaxLength(2000, {
    message: 'La descripción no puede exceder 2000 caracteres',
  })
  description: string;

  /**
   * Fecha de entrega (requerida)
   * Formato: ISO 8601 (ej: 2026-02-15T12:00:00Z)
   * Define el deadline para completar la tarea
   */
  @ApiProperty({
    description: 'Fecha y hora límite de entrega (formato ISO 8601)',
    example: '2026-02-15T12:00:00Z',
    type: String,
    format: 'date-time',
    required: true,
  })
  @IsDateString(
    {},
    { message: 'Debe proporcionar una fecha válida en formato ISO 8601' },
  )
  @IsNotEmpty({ message: 'La fecha de entrega es requerida' })
  deliveryDate: string;

  /**
   * Estado de la tarea (opcional)
   * Valores permitidos: OPEN, PENDING, IN_PROGRESS, DONE
   * Por defecto se asigna PENDING al crear
   */
  @ApiProperty({
    description: 'Estado actual del ciclo de vida de la tarea',
    enum: TaskStatus,
    example: TaskStatus.PENDING,
    default: TaskStatus.PENDING,
    required: false,
  })
  @IsEnum(TaskStatus, {
    message: 'El estado debe ser: OPEN, PENDING, IN_PROGRESS o DONE',
  })
  @IsOptional()
  status?: TaskStatus;

  /**
   * Comentarios adicionales sobre la tarea (opcional)
   * Útil para notas, aclaraciones o contexto extra
   * Máximo 1000 caracteres
   */
  @ApiProperty({
    description: 'Comentarios adicionales, notas o aclaraciones sobre la tarea',
    example:
      'Revisar con el equipo de QA antes de finalizar. Requiere aprobación del líder técnico.',
    type: String,
    maxLength: 1000,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000, {
    message: 'Los comentarios no pueden exceder 1000 caracteres',
  })
  comments?: string;

  /**
   * Persona responsable de ejecutar la tarea (opcional)
   * Nombre completo del responsable asignado
   */
  @ApiProperty({
    description: 'Nombre completo de la persona asignada como responsable',
    example: 'Juan Pérez',
    type: String,
    maxLength: 100,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100, {
    message: 'El nombre del responsable no puede exceder 100 caracteres',
  })
  responsible?: string;

  /**
   * Tags/etiquetas para categorización (opcional)
   * Permite filtrar y organizar tareas por categorías
   * Se puede asignar múltiples etiquetas
   */
  @ApiProperty({
    description: 'Array de etiquetas para categorizar y filtrar tareas',
    example: ['backend', 'documentación', 'prioritaria'],
    type: [String],
    isArray: true,
    required: false,
  })
  @IsArray({ message: 'Las tags deben ser un array' })
  @IsString({ each: true, message: 'Cada tag debe ser un texto' })
  @IsOptional()
  tags?: string[];

  /**
   * Indicador de visibilidad pública (opcional)
   * - true: La tarea es visible, editable y eliminable por cualquier usuario autenticado
   * - false: Solo el propietario puede ver, editar y eliminar la tarea (privada)
   * Por defecto es false (privada)
   */
  @ApiProperty({
    description:
      'Define si la tarea es pública (todos pueden acceder) o privada (solo el propietario)',
    example: false,
    type: Boolean,
    default: false,
    required: false,
  })
  @IsBoolean({ message: 'isPublic debe ser un valor booleano (true/false)' })
  @IsOptional()
  isPublic?: boolean;
}
