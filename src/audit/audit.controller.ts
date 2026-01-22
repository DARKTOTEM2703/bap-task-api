import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { CreateAuditDto } from './dto/create-audit.dto';
import { UpdateAuditDto } from './dto/update-audit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Controlador de Auditoría
 *
 * Gestiona las operaciones CRUD sobre los registros de auditoría del sistema.
 * Requiere autenticación JWT para todos los endpoints.
 * Los registros de auditoría rastrean todas las mutaciones de tareas para cumplimiento normativo.
 */
@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * POST /audit
   * Crea un nuevo registro de auditoría manualmente (uso avanzado)
   */
  @Post()
  @ApiOperation({
    summary: 'Crear registro de auditoría manual',
    description:
      'Crea un registro de auditoría. Normalmente los registros se crean automáticamente.',
  })
  @ApiResponse({
    status: 201,
    description: 'Registro de auditoría creado exitosamente',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  create(@Body() createAuditDto: CreateAuditDto) {
    return this.auditService.create(createAuditDto);
  }

  /**
   * GET /audit
   * Obtiene todos los registros de auditoría del sistema
   */
  @Get()
  @ApiOperation({
    summary: 'Listar todos los registros de auditoría',
    description:
      'Obtiene la lista completa de eventos registrados en el sistema para análisis y cumplimiento.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de registros de auditoría',
    schema: {
      example: [
        {
          id: 1,
          userId: 'uuid-user',
          action: 'CREATE_TASK',
          taskId: 5,
          details: { title: 'Nueva tarea' },
          timestamp: '2026-01-21T12:00:00Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  findAll() {
    return this.auditService.findAll();
  }

  /**
   * GET /audit/:id
   * Obtiene un registro de auditoría específico por ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener registro de auditoría por ID',
    description:
      'Consulta los detalles completos de un evento de auditoría específico.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID del registro de auditoría',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Registro de auditoría encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Registro no encontrado',
  })
  findOne(@Param('id') id: string) {
    return this.auditService.findOne(+id);
  }

  /**
   * PATCH /audit/:id
   * Actualiza parcialmente un registro de auditoría (uso restringido)
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar registro de auditoría',
    description:
      'Actualiza un registro de auditoría. NOTA: Los registros de auditoría deberían ser inmutables en producción.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID del registro de auditoría',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Registro actualizado',
  })
  @ApiResponse({
    status: 404,
    description: 'Registro no encontrado',
  })
  update(@Param('id') id: string, @Body() updateAuditDto: UpdateAuditDto) {
    return this.auditService.update(+id, updateAuditDto);
  }

  /**
   * DELETE /audit/:id
   * Elimina un registro de auditoría (uso restringido)
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar registro de auditoría',
    description:
      'Elimina un registro de auditoría. NOTA: Los registros de auditoría deberían ser inmutables en producción.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID del registro de auditoría',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Registro eliminado',
  })
  @ApiResponse({
    status: 404,
    description: 'Registro no encontrado',
  })
  remove(@Param('id') id: string) {
    return this.auditService.remove(+id);
  }
}
