import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para Registro de Usuario
 *
 * Define los campos requeridos para crear una nueva cuenta de usuario.
 * Incluye validaciones de formato y longitud para garantizar integridad de datos.
 */
export class RegisterDto {
  /**
   * Dirección de correo electrónico única del usuario
   * Será utilizada para login y comunicaciones del sistema
   */
  @ApiProperty({
    description: 'Email único del usuario (será validado)',
    example: 'usuario@example.com',
    type: String,
    required: true,
  })
  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  email: string;

  /**
   * Contraseña segura para la cuenta
   * Se almacenará hasheada con bcrypt para seguridad
   */
  @ApiProperty({
    description: 'Contraseña segura (mínimo 8 caracteres)',
    example: 'SecureP@ssw0rd',
    type: String,
    minLength: 8,
    required: true,
  })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  /**
   * Nombre completo del usuario
   * Se mostrará en la interfaz y registros de auditoría
   */
  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez',
    type: String,
    minLength: 3,
    required: true,
  })
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  name: string;
}
