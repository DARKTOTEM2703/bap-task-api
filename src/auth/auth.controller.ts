import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

/**
 * Controlador de Autenticación
 *
 * Endpoints para login y registro de usuarios con JWT.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Registrar nuevo usuario',
    description:
      'Crea una nueva cuenta de usuario con email, contraseña y nombre. Retorna JWT y datos del usuario.',
  })
  @ApiBody({
    type: RegisterDto,
    examples: {
      example1: {
        summary: 'Registro típico',
        value: {
          email: 'usuario@example.com',
          password: 'MiPassword123',
          name: 'Juan Pérez',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado exitosamente',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '9cfef43b-4f7f-46b6-8a82-85121efcf6f5',
          email: 'usuario@example.com',
          name: 'Juan Pérez',
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Email ya registrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Validación falló - email inválido o contraseña muy corta',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.name,
    );
  }

  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Autentica un usuario con email y contraseña. Retorna JWT válido por 24 horas.',
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      example1: {
        summary: 'Login típico',
        value: {
          email: 'usuario@example.com',
          password: 'MiPassword123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '9cfef43b-4f7f-46b6-8a82-85121efcf6f5',
          email: 'usuario@example.com',
          name: 'Juan Pérez',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas',
  })
  @ApiResponse({
    status: 400,
    description: 'Email o contraseña faltante',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }
}
