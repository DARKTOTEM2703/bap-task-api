import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * DTO para Login
 */
interface LoginDto {
  email: string;
  password: string;
}

/**
 * DTO para Registro
 */
interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

/**
 * Controlador de Autenticación
 *
 * Endpoints para login y registro de usuarios con JWT.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Registra un nuevo usuario
   * @param registerDto - Credenciales del nuevo usuario
   * @returns Token JWT y datos del usuario
   */
  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado exitosamente',
  })
  @ApiResponse({
    status: 409,
    description: 'Email ya registrado',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.name,
    );
  }

  /**
   * Inicia sesión con credenciales
   * @param loginDto - Credenciales del usuario
   * @returns Token JWT y datos del usuario
   */
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }
}
