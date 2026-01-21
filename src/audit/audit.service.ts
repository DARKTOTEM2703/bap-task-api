import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit.entity';

/**
 * Servicio de Auditoría
 *
 * Gestiona operaciones de registro de auditoría para cumplimiento normativo y propósitos forenses.
 * Proporciona operaciones CRUD para entradas de registro de auditoría y método especializado para registrar mutaciones de tareas.
 */
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
   * logAction - Registra una acción en el registro de auditoría
   *
   * Centraliza el registro de auditoría para todas las mutaciones de tareas (CREAR, ACTUALIZAR, ELIMINAR) para mantener
   * un registro inmutable de eventos del sistema para cumplimiento normativo, depuración y análisis forense.
   *
   * @param userId - Identificador del usuario que realiza la acción (extraído del encabezado x-user-id)
   * @param action - Tipo de acción realizada (CREATE_TASK, UPDATE_TASK, DELETE_TASK, etc.)
   * @param taskId - ID de la tarea afectada por esta acción
   * @param details - Objeto opcional que contiene información contextual sobre la carga útil de la acción
   *                  (serializado automáticamente a JSON por la tabla audit_logs)
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
