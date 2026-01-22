import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

/**
 * Controlador Principal de la Aplicación
 *
 * Proporciona endpoints básicos de salud y bienvenida.
 * No requiere autenticación.
 */
@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * GET /
   * Endpoint de bienvenida y verificación de salud
   * Retorna un mensaje confirmando que el API está funcionando
   */
  @Get()
  @ApiOperation({
    summary: 'Mensaje de bienvenida',
    description: 'Endpoint de verificación de salud del API',
  })
  @ApiResponse({
    status: 200,
    description: 'API funcionando correctamente',
    schema: {
      example: 'Welcome to Task Management API',
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
