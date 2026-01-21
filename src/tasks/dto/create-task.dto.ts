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
   */
  @ApiProperty({
    example: 'Terminar documentación',
    description: 'Título descriptivo de la tarea',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  /**
   * Descripción de la tarea (requerida)
   * Debe tener entre 10 y 2000 caracteres
   */
  @ApiProperty({
    example: 'Completar toda la documentación del API incluyendo ejemplos',
    description: 'Descripción detallada de la tarea',
    minLength: 10,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  /**
   * Fecha de entrega (requerida)
   * Formato: ISO 8601 (ej: 2026-02-15T12:00:00Z)
   */
  @ApiProperty({
    example: '2026-02-15T12:00:00Z',
    description: 'Fecha y hora de entrega en formato ISO 8601',
  })
  @IsDateString()
  @IsNotEmpty()
  deliveryDate: string;

  /**
   * Estado de la tarea (opcional)
   * Valores: PENDING, IN_PROGRESS, DONE
   */
  @ApiProperty({
    enum: TaskStatus,
    example: 'PENDING',
    description: 'Estado actual de la tarea',
    required: false,
  })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  /**
   * Comentarios sobre la tarea (opcional)
   */
  @ApiProperty({
    example: 'Revisar con el equipo antes de finalizar',
    description: 'Comentarios adicionales',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  comments?: string;

  /**
   * Persona responsable (opcional)
   */
  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Nombre de la persona responsable',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  responsible?: string;

  /**
   * Tags/etiquetas (opcional)
   */
  @ApiProperty({
    example: ['backend', 'documentación'],
    description: 'Array de etiquetas para categorizar',
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  /**
   * ¿Es una tarea pública? (opcional)
   * Si es true, otros usuarios pueden verla, editarla y eliminarla
   * Si es false, solo el propietario puede acceder
   */
  @ApiProperty({
    example: false,
    description:
      'Si es true, la tarea es visible para todos. Si es false, solo el propietario la ve.',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
