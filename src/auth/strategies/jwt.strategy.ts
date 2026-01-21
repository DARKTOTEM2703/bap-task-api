/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
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
  constructor(
    configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  /**
   * Valida el payload del token JWT
   * @param payload - Payload del token decodificado
   * @returns Usuario autenticado
   */

  async validate(payload: JwtPayload): Promise<ValidatedUser> {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    return { id: user.id, email: user.email, name: user.name };
  }
}
