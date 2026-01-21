import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para Registro
 *
 * Credenciales y datos requeridos para registrar un nuevo usuario.
 */
export class RegisterDto {
  /**
   * Email del usuario
   */
  @ApiProperty({ example: 'usuario@example.com' })
  @IsEmail()
  email: string;

  /**
   * Contraseña del usuario (mínimo 8 caracteres)
   */
  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  @MinLength(8)
  password: string;

  /**
   * Nombre completo del usuario (mínimo 3 caracteres)
   */
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @MinLength(3)
  name: string;
}
