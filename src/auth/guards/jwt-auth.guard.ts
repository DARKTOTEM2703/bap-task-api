import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Auth Guard
 *
 * Guard para proteger rutas que requieren autenticación con JWT.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
