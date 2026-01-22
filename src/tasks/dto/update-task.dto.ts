import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';

/**
 * DTO para actualizar una tarea existente
 *
 * Extiende CreateTaskDto haciendo todos los campos opcionales usando PartialType.
 * Permite actualización parcial (PATCH) de tareas existentes.
 * Solo los campos proporcionados serán actualizados, el resto permanece sin cambios.
 *
 * Hereda automáticamente todos los decoradores @ApiProperty de CreateTaskDto
 * con la marca de 'required: false' para cada campo.
 *
 * @example
 * ```json
 * {
 *   "status": "IN_PROGRESS",
 *   "comments": "Avance del 50%"
 * }
 * ```
 */
export class UpdateTaskDto extends PartialType(CreateTaskDto) {}
