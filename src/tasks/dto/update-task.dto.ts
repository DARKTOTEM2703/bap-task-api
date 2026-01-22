import {
  IsString,
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
 * DTO para actualizar una tarea existente
 *
 * Todos los campos son opcionales, permitiendo actualización parcial (PATCH).
 * Solo los campos proporcionados serán actualizados, el resto permanece sin cambios.
 *
 * En Swagger verás selectores y campos individuales para mejor UX durante testing.
 */
export class UpdateTaskDto {
  /**
   * Título de la tarea (opcional)
   * Entre 3 y 200 caracteres
   */
  @ApiProperty({
    description: 'Título descriptivo de la tarea',
    example: 'Terminar documentación del API',
    type: String,
    minLength: 3,
    maxLength: 200,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  /**
   * Descripción de la tarea (opcional)
   * Entre 10 y 2000 caracteres
   */
  @ApiProperty({
    description: 'Descripción detallada de la tarea con instrucciones',
    example: 'Completar toda la documentación del API incluyendo ejemplos',
    type: String,
    minLength: 10,
    maxLength: 2000,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(10)
  @MaxLength(2000)
  description?: string;

  /**
   * Fecha de entrega (opcional)
   * Formato ISO 8601
   */
  @ApiProperty({
    description: 'Fecha y hora límite de entrega',
    example: '2026-02-15T12:00:00Z',
    type: String,
    format: 'date-time',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  deliveryDate?: string;

  /**
   * Estado de la tarea (opcional)
   * Selector con opciones: OPEN, PENDING, IN_PROGRESS, DONE
   */
  @ApiProperty({
    description: 'Estado actual del ciclo de vida',
    enum: TaskStatus,
    example: TaskStatus.IN_PROGRESS,
    required: false,
  })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  /**
   * Comentarios adicionales (opcional)
   */
  @ApiProperty({
    description: 'Notas o aclaraciones sobre la tarea',
    example: 'Avance del 50%',
    type: String,
    maxLength: 1000,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  comments?: string;

  /**
   * Responsable (opcional)
   */
  @ApiProperty({
    description: 'Nombre de la persona asignada',
    example: 'Juan Pérez',
    type: String,
    maxLength: 100,
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
    description: 'Array de etiquetas para categorizar',
    example: ['backend', 'documentación'],
    type: [String],
    isArray: true,
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  /**
   * Visibilidad de la tarea (opcional)
   */
  @ApiProperty({
    description: 'Si es true, visible para todos. Si es false, solo para el propietario',
    example: false,
    type: Boolean,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
