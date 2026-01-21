import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para Login
 *
 * Credenciales requeridas para iniciar sesión.
 */
export class LoginDto {
  /**
   * Email del usuario
   */
  @ApiProperty({ example: 'usuario@example.com' })
  @IsEmail()
  email: string;

  /**
   * Contraseña del usuario (mínimo 6 caracteres)
   */
  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;
}
