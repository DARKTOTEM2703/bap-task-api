import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  BadRequestException,
  Request,
  Logger,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Readable } from 'stream';
import Busboy from 'busboy';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface StreamRequest extends AuthenticatedRequest {
  on(event: 'data', listener: (chunk: Buffer) => void): void;
  on(event: 'end', listener: () => void): void;
  on(event: 'error', listener: (error: Error) => void): void;
  pause(): void;
  connection: { destroy(): void };
  get(name: string): string | undefined;
}

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  // File validation constants
  private readonly FILE_VALIDATION = {
    MAX_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
    ALLOWED_MIMES: ['application/pdf', 'image/png', 'image/jpeg'] as const,
    ALLOWED_EXTENSIONS: ['.pdf', '.png', '.jpg', '.jpeg'] as const,
  } as const;

  constructor(private readonly tasksService: TasksService) { }

  /**
   * Helper: Parse multipart form data to extract file buffer, filename and mimetype
   * Usa busboy para parsear multipart/form-data de manera profesional
   */
  private parseMultipartBuffer(
    buffer: Buffer,
    contentType: string,
  ): Promise<{
    fileBuffer: Buffer;
    filename: string;
    mimetype: string;
  }> {
    const logger = new Logger('TasksController.parseMultipartBuffer');

    return new Promise((resolve, reject) => {
      const bb = Busboy({ headers: { 'content-type': contentType } });
      let fileBuffer: Buffer | null = null;
      let filename = '';
      let mimetype = '';

      bb.on('file', (fieldname, file, info) => {
        if (fieldname !== 'file') {
          file.resume(); // Ignorar campos que no sean 'file'
          return;
        }

        filename = info.filename;
        mimetype = info.mimeType || 'application/octet-stream';

        // Validar MIME type
        if (
          !this.FILE_VALIDATION.ALLOWED_MIMES.includes(
            mimetype as (typeof this.FILE_VALIDATION.ALLOWED_MIMES)[number],
          )
        ) {
          file.resume();
          reject(
            new BadRequestException(
              `Formato no permitido. Solo se permiten: PDF, PNG, JPG. Recibido: ${mimetype}`,
            ),
          );
          return;
        }

        // Validar extensión
        const extension = filename
          .toLowerCase()
          .substring(filename.lastIndexOf('.'));

        if (
          !this.FILE_VALIDATION.ALLOWED_EXTENSIONS.includes(
            extension as (typeof this.FILE_VALIDATION.ALLOWED_EXTENSIONS)[number],
          )
        ) {
          file.resume();
          reject(
            new BadRequestException(`Extensión no permitida: ${extension}`),
          );
          return;
        }

        // Recolectar chunks del archivo
        const chunks: Buffer[] = [];
        file.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        file.on('end', () => {
          fileBuffer = Buffer.concat(chunks);

          // Validar tamaño final
          if (fileBuffer.length > this.FILE_VALIDATION.MAX_SIZE_BYTES) {
            reject(
              new BadRequestException(
                `Archivo demasiado grande: ${(
                  fileBuffer.length /
                  1024 /
                  1024
                ).toFixed(2)}MB (máximo 5MB)`,
              ),
            );
            return;
          }
        });

        file.on('error', (error: Error) => {
          reject(
            new BadRequestException(
              `Error procesando archivo: ${error.message}`,
            ),
          );
        });
      });

      bb.on('close', () => {
        if (!fileBuffer) {
          reject(new BadRequestException('No se encontró archivo'));
          return;
        }

        logger.debug(
          `Parsed multipart: ${filename} (${fileBuffer.length} bytes, ${mimetype})`,
        );

        resolve({ fileBuffer, filename, mimetype });
      });

      bb.on('error', (error: Error) => {
        reject(
          new BadRequestException(
            `Error parseando multipart: ${error.message}`,
          ),
        );
      });

      bb.write(buffer);
      bb.end();
    });
  }

  /**
   * POST /tasks
   * Crea una nueva tarea para el usuario autenticado.
   */
  @Post()
  @ApiOperation({
    summary: 'Crear nueva tarea',
    description:
      'Crea una tarea privada o pública según el usuario especifique',
  })
  @ApiResponse({
    status: 201,
    description: 'Tarea creada exitosamente',
    example: {
      id: 1,
      title: 'Mi tarea',
      description: 'Descripción de la tarea',
      status: 'PENDING',
      deliveryDate: '2026-02-15',
      isPublic: false,
      userId: 'uuid-user',
      createdAt: '2026-01-21T12:00:00Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos en la solicitud',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - falta JWT válido',
  })
  create(
    @Body() createTaskDto: CreateTaskDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.tasksService.create(createTaskDto, req.user.id);
  }

  /**
   * GET /tasks
   * Obtiene una lista paginada de tareas visibles para el usuario (tareas propias + tareas públicas de otros).
   * Soporta paginación, filtrado avanzado y ordenamiento a través de parámetros de consulta.
   *
   * Query Parameters:
   * - page: número de página (default: 1)
   * - limit: resultados por página (default: 10)
   * - status: filtrar por estado (PENDING, IN_PROGRESS, DONE)
   * - responsible: filtrar por responsable
   * - startDate: fecha inicial para filtro de entrega (YYYY-MM-DD)
   * - endDate: fecha final para filtro de entrega (YYYY-MM-DD)
   * - tags: filtrar por tags (separados por comas)
   * - orderBy: campo para ordenar (createdAt, deliveryDate, status, title, updatedAt)
   * - orderDirection: ASC o DESC
   */
  @Get()
  @ApiOperation({
    summary: 'Listar tareas con paginación y filtros',
    description:
      'Obtiene todas las tareas del usuario actual (privadas) más todas las tareas públicas de otros usuarios. Soporta paginación, filtrado y ordenamiento.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Resultados por página (default: 10)',
    example: 10,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filtrar por estado',
    enum: ['PENDING', 'IN_PROGRESS', 'DONE'],
  })
  @ApiQuery({
    name: 'responsible',
    required: false,
    type: String,
    description: 'Filtrar por responsable',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Fecha inicial (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Fecha final (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'tags',
    required: false,
    type: String,
    description: 'Filtrar por tags (separados por comas)',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    type: String,
    description: 'Campo para ordenar',
    enum: ['createdAt', 'deliveryDate', 'status', 'title', 'updatedAt'],
  })
  @ApiQuery({
    name: 'orderDirection',
    required: false,
    type: String,
    description: 'Dirección de orden',
    enum: ['ASC', 'DESC'],
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de tareas obtenida correctamente',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  findAll(
    @Request() req: AuthenticatedRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('responsible') responsible?: string,
    @Query('tags') tags?: string,
    @Query('orderBy') orderBy = 'createdAt',
    @Query('orderDirection') orderDirection: 'ASC' | 'DESC' = 'DESC',
  ) {
    return this.tasksService.findAll(
      req.user.id,
      +page,
      +limit,
      status,
      startDate,
      endDate,
      responsible,
      tags,
      orderBy,
      orderDirection,
    );
  }

  /**
   * GET /tasks/:id
   * Obtiene una tarea específica por su ID.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener tarea por ID',
    description:
      'Obtiene los detalles completos de una tarea. Solo el propietario puede ver tareas privadas.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la tarea',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Tarea obtenida correctamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Tarea no encontrada',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permiso para ver esta tarea privada',
  })
  findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.tasksService.findOne(+id, req.user?.id);
  }

  /**
   * PUT /tasks/:id
   * Actualiza completamente una tarea. Solo el propietario de la tarea privada o cualquiera para pública.
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar tarea',
    description:
      'Actualiza una tarea. Solo el propietario puede editar tareas privadas.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la tarea',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Tarea actualizada correctamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Tarea no encontrada',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permiso para editar esta tarea',
  })
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.tasksService.update(+id, updateTaskDto, req.user.id);
  }

  /**
   * DELETE /tasks/:id
   * Elimina una tarea del sistema. Solo el propietario de la tarea privada o cualquiera para pública.
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar tarea',
    description:
      'Elimina una tarea permanentemente. Solo el propietario puede eliminar tareas privadas.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la tarea',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Tarea eliminada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Tarea no encontrada',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permiso para eliminar esta tarea',
  })
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.tasksService.remove(+id, req.user.id);
  }

  /**
   * POST /tasks/:id/upload
   * Carga un archivo adjunto a una tarea usando streams puros.
   * Valida tamaño, tipo MIME y extensión mientras se recibe.
   */
  @Post(':id/upload')
  @ApiOperation({
    summary: 'Subir archivo adjunto a tarea (streams)',
    description:
      'Carga un archivo (PDF, PNG, JPG max 5MB) usando streams puros. Más eficiente para archivos grandes.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la tarea',
    example: 1,
  })
  @ApiBody({
    description: 'Archivo para subir',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo (PDF, PNG o JPG, máximo 5MB)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Archivo subido correctamente',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Archivo subido exitosamente' },
        file: {
          type: 'object',
          properties: {
            url: { type: 'string', example: 'https://minio:9000/tasks/...' },
            filename: { type: 'string', example: 'documento.pdf' },
            size: { type: 'number', example: 1024000 },
            mimetype: { type: 'string', example: 'application/pdf' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Archivo inválido o formato no permitido',
  })
  @ApiResponse({
    status: 404,
    description: 'Tarea no encontrada',
  })
  @ApiResponse({
    status: 413,
    description: 'Archivo muy grande (máximo 5MB)',
  })
  async uploadFile(
    @Param('id') id: string,
    @Request() req: StreamRequest,
  ): Promise<{
    success: boolean;
    message: string;
    file: { url: string; filename: string; size: number; mimetype: string };
  }> {
    const logger = new Logger('TasksController.uploadFile');
    const taskId = +id;

    /**
     * Extraer información del request
     */
    const contentType = req.get('content-type');
    const contentLength = req.get('content-length');

    // Validar Content-Type
    if (!contentType?.startsWith('multipart/form-data')) {
      throw new BadRequestException(
        'Content-Type debe ser multipart/form-data',
      );
    }

    // Validar Content-Length (primera capa)
    if (
      contentLength &&
      parseInt(contentLength) > this.FILE_VALIDATION.MAX_SIZE_BYTES
    ) {
      throw new BadRequestException(
        `Archivo demasiado grande: ${(
          parseInt(contentLength) /
          1024 /
          1024
        ).toFixed(2)}MB (máximo 5MB)`,
      );
    }

    return new Promise((resolve, reject) => {
      let totalSize = 0;
      let filename = '';
      let mimetype = '';
      const chunks: Buffer[] = [];

      /**
       * Procesar el stream del request
       */

      req.on('data', (chunk: Buffer) => {
        totalSize += chunk.length;

        // Validar tamaño mientras se recibe (segunda capa)
        if (totalSize > this.FILE_VALIDATION.MAX_SIZE_BYTES) {
          req.pause();

          req.connection.destroy();

          logger.warn(
            `Upload rechazado: archivo excede 5MB (${(
              totalSize /
              1024 /
              1024
            ).toFixed(2)}MB)`,
          );

          reject(
            new BadRequestException(
              `Archivo demasiado grande: ${(totalSize / 1024 / 1024).toFixed(
                2,
              )}MB (máximo 5MB)`,
            ),
          );
          return;
        }

        chunks.push(chunk);
      });

      /**
       * Cuando termina el stream
       */

      req.on('end', () => {
        // Handle async operations without async in callback
        void (async () => {
          try {
            const buffer = Buffer.concat(chunks);

            // Use helper to parse multipart and extract file data
            const {
              fileBuffer,
              filename: parsedFilename,
              mimetype: parsedMimetype,
            } = await this.parseMultipartBuffer(buffer, contentType || '');

            // Rename for clarity in this scope
            filename = parsedFilename;
            mimetype = parsedMimetype;

            // Convertir a stream y subir
            const fileStream = Readable.from(fileBuffer);

            const result = await this.tasksService.uploadFileStream(
              taskId,
              fileStream,
              filename,
              mimetype,
              req.user.id,
            );

            logger.log(
              `Archivo subido exitosamente: ${filename} (${fileBuffer.length} bytes)`,
            );

            resolve({
              success: true,
              message: 'Archivo cargado exitosamente',
              file: {
                url: result.url,
                filename: result.filename,
                size: fileBuffer.length,
                mimetype,
              },
            });
          } catch (error) {
            logger.error(`Error al procesar upload: ${error}`);
            reject(error instanceof Error ? error : new Error(String(error)));
          }
        })();
      });

      /**
       * Manejar errores del stream
       */

      req.on('error', (error: Error) => {
        logger.error(`Error en stream: ${error.message}`);
        reject(
          new BadRequestException(`Error al recibir archivo: ${error.message}`),
        );
      });
    });
  }
}
