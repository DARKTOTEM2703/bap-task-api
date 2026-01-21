import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

/**
 * Servicio de Usuarios
 *
 * Gestiona operaciones CRUD de usuarios y validación de credenciales.
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * Crea un nuevo usuario con contraseña hasheada
   * @param email - Email único del usuario
   * @param password - Contraseña en texto plano
   * @param name - Nombre completo
   * @returns Usuario creado
   */
  async create(email: string, password: string, name: string): Promise<User> {
    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      name,
    });

    return this.usersRepository.save(user);
  }

  /**
   * Busca un usuario por email
   * @param email - Email del usuario
   * @returns Usuario encontrado
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  /**
   * Busca un usuario por ID
   * @param id - ID del usuario
   * @returns Usuario encontrado
   */
  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  /**
   * Valida contraseña del usuario
   * @param plainPassword - Contraseña en texto plano
   * @param hashedPassword - Contraseña hasheada
   * @returns true si coincide
   */
  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
