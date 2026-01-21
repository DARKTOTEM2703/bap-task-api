import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit.entity';

/**
 * AuditService
 *
 * Manages audit logging operations for compliance and forensic purposes.
 * Provides CRUD operations for audit log entries and specialized method for recording task mutations.
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
   * logAction - Records an action in the audit log
   *
   * Centralizes audit logging for all task mutations (CREATE, UPDATE, DELETE) to maintain
   * an immutable record of system events for compliance, debugging, and forensic analysis.
   *
   * @param userId - Identifier of the user performing the action (extracted from x-user-id header)
   * @param action - Type of action performed (CREATE_TASK, UPDATE_TASK, DELETE_TASK, etc.)
   * @param taskId - ID of the task affected by this action
   * @param details - Optional object containing contextual information about the action payload
   *                  (automatically serialized to JSON by the audit_logs table)
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
