import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

/**
 * Servicio de Autenticación
 *
 * Maneja login, registro y validación de tokens JWT.
 */
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Registra un nuevo usuario
   * @param email - Email del usuario
   * @param password - Contraseña en texto plano
   * @param name - Nombre completo
   * @returns Token JWT y datos del usuario
   */
  async register(
    email: string,
    password: string,
    name: string,
  ): Promise<{
    access_token: string;
    user: { id: string; email: string; name: string };
  }> {
    const user = await this.usersService.create(email, password, name);

    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  /**
   * Inicia sesión validando credenciales
   * @param email - Email del usuario
   * @param password - Contraseña en texto plano
   * @returns Token JWT y datos del usuario
   */
  async login(
    email: string,
    password: string,
  ): Promise<{
    access_token: string;
    user: { id: string; email: string; name: string };
  }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  /**
   * Valida y decodifica un token JWT
   * @param token - Token JWT
   * @returns Payload decodificado
   */
  validateToken(token: string): { sub: string; email: string } {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }
}
