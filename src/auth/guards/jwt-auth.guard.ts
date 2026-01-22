import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Authentication Guard
 *
 * Guard de protección para rutas que requieren autenticación JWT.
 * Valida automáticamente el token Bearer del header Authorization.
 * Utiliza JwtStrategy para validar y decodificar el token.
 *
 * @example
 * ```typescript
 * @UseGuards(JwtAuthGuard)
 * @Get('protected')
 * protectedRoute() {
 *   return 'Solo usuarios autenticados pueden ver esto';
 * }
 * ```
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
