import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async create(createAuditDto: Partial<AuditLog>) {
    const log = this.auditRepository.create(createAuditDto);
    return this.auditRepository.save(log);
  }

  async findAll() {
    return this.auditRepository.find();
  }

  async findOne(id: number) {
    return this.auditRepository.findOneBy({ id });
  }

  async update(id: number, updateAuditDto: Partial<AuditLog>) {
    await this.auditRepository.update(id, updateAuditDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    return this.auditRepository.delete(id);
  }

  /**
   * Registra una acción en la bitácora de auditoría.
   * @param userId ID del usuario que realiza la acción.
   * @param action Tipo de acción realizada (ej. CREATE_TASK).
   * @param taskId ID de la tarea afectada.
   * @param details Objeto opcional con detalles adicionales (se guardará como JSON).
   */
  async logAction(
    userId: string,
    action: string,
    taskId: number,
    details?: Record<string, unknown>,
  ) {
    const log = this.auditRepository.create({
      userId,
      action,
      taskId,
      details: details ?? undefined,
    });

    return await this.auditRepository.save(log);
  }
}
