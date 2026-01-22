import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para Login
 *
 * Credenciales requeridas para iniciar sesión en el sistema.
 * Valida formato de email y longitud mínima de contraseña.
 */
export class LoginDto {
  /**
   * Dirección de correo electrónico del usuario
   * Debe ser un email válido registrado en el sistema
   */
  @ApiProperty({
    description: 'Email del usuario registrado',
    example: 'usuario@example.com',
    type: String,
    required: true,
  })
  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  email: string;

  /**
   * Contraseña del usuario
   * Debe tener al menos 6 caracteres de longitud
   */
  @ApiProperty({
    description: 'Contraseña de la cuenta (mínimo 6 caracteres)',
    example: 'password123',
    type: String,
    minLength: 6,
    required: true,
  })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}
