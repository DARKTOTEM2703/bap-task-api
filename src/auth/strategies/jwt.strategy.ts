/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

interface JwtPayload {
  sub: string;
  email: string;
}

interface ValidatedUser {
  id: string;
  email: string;
  name: string;
}

/**
 * JWT Strategy para Passport
 *
 * Valida tokens JWT y extrae la información del usuario.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Valida el payload del token JWT
   * @param payload - Payload del token decodificado
   * @returns Usuario autenticado
   * @throws UnauthorizedException si el usuario no existe
   */
  async validate(payload: JwtPayload): Promise<ValidatedUser> {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      this.logger.warn(
        `Intento de acceso con JWT para usuario inexistente: ${payload.sub}`,
      );
      throw new UnauthorizedException(
        'Token inválido - Usuario no existe. Por favor inicia sesión nuevamente',
      );
    }

    return { id: user.id, email: user.email, name: user.name };
  }
}
