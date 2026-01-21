import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { ConfigService } from '@nestjs/config';

/**
 * Servicio de Almacenamiento
 *
 * Gestiona la carga de archivos en MinIO (compatible con S3).
 * Valida tamaño máximo (5MB) y formatos permitidos (.pdf, .png, .jpg).
 */
@Injectable()
export class StorageService {
  private s3: AWS.S3;

  constructor(private configService: ConfigService) {
    this.s3 = new AWS.S3({
      accessKeyId: this.configService.get('MINIO_ACCESS_KEY') || 'minioadmin',
      secretAccessKey:
        this.configService.get('MINIO_SECRET_KEY') || 'minioadmin',
      endpoint:
        this.configService.get('MINIO_ENDPOINT') || 'http://localhost:9000',
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
    });
  }

  /**
   * Valida que el archivo cumpla con los requisitos
   * @param file - Archivo subido
   * @returns true si es válido, lanza excepción si no
   */
  private validateFile(file: Express.Multer.File): boolean {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];
    const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];

    // Validar tamaño
    if (file.size > MAX_SIZE) {
      throw new Error(
        `El archivo excede el tamaño máximo de 5MB (actual: ${file.size / 1024 / 1024}MB)`,
      );
    }

    // Validar tipo MIME
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new Error(
        `Formato no permitido. Formatos válidos: PDF, PNG, JPG (recibido: ${file.mimetype})`,
      );
    }

    // Validar extensión
    const extension = file.originalname
      .toLowerCase()
      .substring(file.originalname.lastIndexOf('.'));
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      throw new Error(`Extensión no permitida: ${extension}`);
    }

    return true;
  }

  /**
   * Carga un archivo a MinIO
   * @param file - Archivo a cargar
   * @param taskId - ID de la tarea asociada
   * @returns URL pública del archivo
   */
  async uploadFile(
    file: Express.Multer.File,
    taskId: number,
  ): Promise<{
    url: string;
    filename: string;
    size: number;
    mimetype: string;
  }> {
    this.validateFile(file);

    const bucket =
      this.configService.get<string>('MINIO_BUCKET') || 'tasks-files';
    const timestamp = Date.now();
    const filename = `tasks/${taskId}/${timestamp}-${file.originalname}`;

    try {
      // Crear bucket si no existe
      try {
        await this.s3.headBucket({ Bucket: bucket }).promise();
      } catch {
        await this.s3.createBucket({ Bucket: bucket }).promise();
      }

      // Subir archivo
      const params = {
        Bucket: bucket,
        Key: filename,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          'task-id': taskId.toString(),
          'uploaded-at': new Date().toISOString(),
        },
      };

      await this.s3.upload(params).promise();

      // Generar URL pública
      const endpoint =
        this.configService.get<string>('MINIO_ENDPOINT') ||
        'http://localhost:9000';
      const url = `${endpoint}/${bucket}/${filename}`;

      return {
        url,
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Error al subir archivo: ${errorMessage}`);
    }
  }

  /**
   * Elimina un archivo de MinIO
   * @param fileKey - Clave del archivo (ruta en MinIO)
   */
  async deleteFile(fileKey: string): Promise<void> {
    const bucket =
      this.configService.get<string>('MINIO_BUCKET') || 'tasks-files';

    try {
      const params = {
        Bucket: bucket,
        Key: fileKey,
      };

      await this.s3.deleteObject(params).promise();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Error al eliminar archivo: ${errorMessage}`);
    }
  }
}
