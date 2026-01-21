import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

/**
 * Servicio de Almacenamiento
 *
 * Gestiona la carga de archivos en MinIO (compatible con S3).
 * Valida tamaño máximo (5MB) y formatos permitidos (.pdf, .png, .jpg).
 * Utiliza AWS SDK v3 para operaciones S3.
 */
@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private readonly logger = new Logger(StorageService.name);

  constructor(private configService: ConfigService) {
    const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY');
    const secretKey = this.configService.get<string>('MINIO_SECRET_KEY');
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT');

    if (!accessKey || !secretKey || !endpoint) {
      this.logger.error('MinIO configuration incomplete');
      throw new InternalServerErrorException(
        'MinIO configuration incomplete: MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_ENDPOINT are required',
      );
    }

    this.s3Client = new S3Client({
      region: 'us-east-1',
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true,
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
      throw new BadRequestException(
        `El archivo excede el tamaño máximo de 5MB (actual: ${(
          file.size /
          1024 /
          1024
        ).toFixed(2)} MB)`,
      );
    }

    // Validar tipo MIME
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Formato no permitido. Formatos válidos: PDF, PNG, JPG (recibido: ${file.mimetype})`,
      );
    }

    // Validar extensión
    const extension = file.originalname
      .toLowerCase()
      .substring(file.originalname.lastIndexOf('.'));
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      throw new BadRequestException(`Extensión no permitida: ${extension}`);
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

    const bucket = this.configService.get<string>('MINIO_BUCKET');
    if (!bucket) {
      this.logger.error('MINIO_BUCKET no configurado');
      throw new InternalServerErrorException(
        'MINIO_BUCKET environment variable is required',
      );
    }

    const timestamp = Date.now();
    const filename = `tasks/${taskId}/${timestamp}-${file.originalname}`;

    try {
      // Ensure bucket exists
      try {
        await this.s3Client.send(
          new HeadBucketCommand({ Bucket: bucket }),
        );
      } catch {
        this.logger.log(`Bucket ${bucket} does not exist. Creating...`);
        await this.s3Client.send(
          new CreateBucketCommand({ Bucket: bucket }),
        );
      }

      // Upload file to MinIO
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: filename,
          Body: file.buffer,
          ContentType: file.mimetype,
          Metadata: {
            'task-id': taskId.toString(),
            'uploaded-at': new Date().toISOString(),
          },
        }),
      );
      this.logger.log(`File uploaded to MinIO: ${bucket}/${filename}`);

      // Generate public URL
      const endpoint = this.configService.get<string>('MINIO_ENDPOINT');
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
      this.logger.error(
        `Error uploading file: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        `Error uploading file: ${errorMessage}`,
      );
    }
  }

  async deleteFile(fileKey: string): Promise<void> {
    const bucket = this.configService.get<string>('MINIO_BUCKET');
    if (!bucket) {
      this.logger.error('MINIO_BUCKET not configured');
      throw new InternalServerErrorException(
        'MINIO_BUCKET environment variable is required',
      );
    }

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: fileKey,
        }),
      );
      this.logger.log(`File deleted from MinIO: ${bucket}/${fileKey}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error deleting file: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        `Error deleting file: ${errorMessage}`,
      );
    }
  }
}
