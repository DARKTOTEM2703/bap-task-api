import { Injectable } from '@nestjs/common';

/**
 * Servicio Principal de la Aplicación
 *
 * Contiene la lógica de negocio para endpoints básicos y de salud.
 * Actualmente proporciona un mensaje de bienvenida simple.
 */
@Injectable()
export class AppService {
  /**
   * Retorna un mensaje de bienvenida
   * Utilizado para verificar que el API está funcionando correctamente
   * @returns Mensaje de bienvenida
   */
  getHello(): string {
    return 'Hello World!';
  }
}
