import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';

/**
 * Servicio de Almacenamiento con Streams
 *
 * Gestiona la carga de archivos en MinIO (compatible con S3) usando streams.
 * Ventajas de usar streams:
 * - Menor uso de memoria (no carga todo el archivo en RAM)
 * - Mejor para archivos grandes (escalable)
 * - Permite procesamiento paralelo (chunks)
 * - Reduce latencia al empezar a subir antes
 *
 * Valida tamaño máximo (5MB) y formatos permitidos (.pdf, .png, .jpg).
 * Utiliza AWS SDK v3 con @aws-sdk/lib-storage para uploads eficientes.
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
   * Nota: La validación de archivo (tamaño, tipo MIME, extensión) se realiza
   * en el FileInterceptor del controlador ANTES de llegar aquí, para evitar
   * cargar archivos innecesariamente en memoria.
   * Este método solo sube el archivo ya validado a MinIO.
   */

  /**
   * Carga un archivo a MinIO usando streams
   * Ventajas: Menor uso de memoria, mejor rendimiento para archivos grandes
   *
   * @param file - Buffer del archivo
   * @param taskId - ID de la tarea asociada
   * @param originalFilename - Nombre original del archivo
   * @param mimeType - Tipo MIME del archivo
   * @returns Objeto con URL pública y metadatos del archivo
   */
  async uploadFile(
    file: Buffer,
    taskId: number,
    originalFilename: string,
    mimeType: string,
  ): Promise<{
    url: string;
    filename: string;
    size: number;
    mimetype: string;
  }> {
    // Archivo ya fue validado en el controlador antes de llegar aquí

    const bucket = this.configService.get<string>('MINIO_BUCKET');
    if (!bucket) {
      this.logger.error('MINIO_BUCKET no configurado');
      throw new InternalServerErrorException(
        'MINIO_BUCKET environment variable is required',
      );
    }

    const timestamp = Date.now();
    const filename = `tasks/${taskId}/${timestamp}-${originalFilename}`;

    try {
      // Ensure bucket exists
      try {
        await this.s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
      } catch {
        this.logger.log(`Bucket ${bucket} does not exist. Creating...`);
        await this.s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
      }

      // Convertir buffer a stream para upload eficiente
      // Esto permite que AWS SDK maneje el archivo en chunks
      const stream = Readable.from(file);

      // Usar Upload multipart de AWS SDK v3 para streams
      // Automáticamente divide en chunks y sube en paralelo
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: bucket,
          Key: filename,
          Body: stream,
          ContentType: mimeType,
          Metadata: {
            'task-id': taskId.toString(),
            'uploaded-at': new Date().toISOString(),
            'original-name': originalFilename,
          },
        },
        // Configuración de chunks para optimizar el upload
        queueSize: 4, // Número de partes a subir en paralelo
        partSize: 1024 * 1024 * 5, // 5MB por parte (mínimo de S3)
      });

      // Monitorear progreso del upload (opcional, útil para archivos grandes)
      upload.on('httpUploadProgress', (progress) => {
        if (progress.loaded && progress.total) {
          const percentage = ((progress.loaded / progress.total) * 100).toFixed(
            2,
          );
          this.logger.debug(
            `Upload progress: ${percentage}% (${progress.loaded}/${progress.total} bytes)`,
          );
        }
      });

      // Ejecutar upload
      await upload.done();

      this.logger.log(
        `File uploaded to MinIO using streams: ${bucket}/${filename}`,
      );

      // Generate public URL
      const endpoint = this.configService.get<string>('MINIO_ENDPOINT');
      const url = `${endpoint}/${bucket}/${filename}`;

      return {
        url,
        filename: filename || 'archivo',
        size: file.length,
        mimetype: mimeType || 'application/octet-stream',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error uploading file with streams: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        `Error uploading file: ${errorMessage}`,
      );
    }
  }

  /**
   * Elimina un archivo de MinIO
   * Utilizado cuando se actualiza o elimina una tarea con archivo adjunto
   * @param fileKey - Ruta del archivo en el bucket (ej: tasks/123/1234567890-file.pdf)
   * @throws InternalServerErrorException si falla la eliminación
   */
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

  /**
   * Carga un archivo desde stream directo (sin buffer intermedio)
   * Máxima eficiencia de memoria - ideal para archivos grandes
   * @param stream - Stream del archivo
   * @param filename - Nombre original del archivo
   * @param mimetype - Tipo MIME del archivo
   * @param taskId - ID de la tarea asociada
   * @returns URL pública y key del archivo
   */
  async uploadFileStream(
    stream: Readable,
    filename: string,
    mimetype: string,
    taskId: number,
  ): Promise<{
    url: string;
    key: string;
    filename: string;
  }> {
    const bucket = this.configService.get<string>('MINIO_BUCKET');
    if (!bucket) {
      this.logger.error('MINIO_BUCKET no configurado');
      throw new InternalServerErrorException(
        'MINIO_BUCKET environment variable is required',
      );
    }

    const timestamp = Date.now();
    const fileKey = `tasks/${taskId}/${timestamp}-${filename}`;

    try {
      // Asegurar que el bucket existe
      try {
        await this.s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
      } catch {
        this.logger.log(`Bucket ${bucket} does not exist. Creating...`);
        await this.s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
      }

      // Upload desde stream directo con Upload de AWS SDK
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: bucket,
          Key: fileKey,
          Body: stream,
          ContentType: mimetype,
          Metadata: {
            'task-id': taskId.toString(),
            'uploaded-at': new Date().toISOString(),
            'original-name': filename,
          },
        },
        queueSize: 4,
        partSize: 1024 * 1024 * 5, // 5MB chunks
      });

      // Monitorear progreso
      upload.on('httpUploadProgress', (progress) => {
        if (progress.loaded && progress.total) {
          const percentage = ((progress.loaded / progress.total) * 100).toFixed(
            2,
          );
          this.logger.debug(
            `Stream upload progress: ${percentage}% (${progress.loaded}/${progress.total} bytes)`,
          );
        }
      });

      await upload.done();

      this.logger.log(
        `File uploaded from stream to MinIO: ${bucket}/${fileKey}`,
      );

      const endpoint = this.configService.get<string>('MINIO_ENDPOINT');
      const url = `${endpoint}/${bucket}/${fileKey}`;

      return {
        url,
        key: fileKey,
        filename,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error uploading file stream: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        `Error uploading file: ${errorMessage}`,
      );
    }
  }
}
