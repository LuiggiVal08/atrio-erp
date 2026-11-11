import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';

@Injectable()
export class MinioStorageService implements OnModuleInit {
  private client: Minio.Client;
  private signingClient: Minio.Client;
  private readonly bucketPrefix = 'reports';

  constructor() {
    const clientOptions = {
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'atrio_reportes',
      secretKey: process.env.MINIO_SECRET_KEY || 'minio_dev_pass',
    };
    this.client = new Minio.Client({
      ...clientOptions,
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    });
    this.signingClient = new Minio.Client({
      ...clientOptions,
      endPoint: process.env.MINIO_PUBLIC_ENDPOINT || process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PUBLIC_PORT || process.env.MINIO_PORT || '9000', 10),
      useSSL: process.env.MINIO_PUBLIC_USE_SSL === 'true' || process.env.MINIO_USE_SSL === 'true',
      // Fixed region skips presignedGetObject's network region lookup, which would
      // otherwise target the public endpoint (unreachable from inside the API container).
      region: 'us-east-1',
    });
  }

  async onModuleInit(): Promise<void> {
    // No auto-create buckets here — they are created per tenant on first upload
  }

  private bucketName(tenantId: string): string {
    return `${this.bucketPrefix}-${tenantId}`;
  }

  async ensureBucket(tenantId: string): Promise<void> {
    const name = this.bucketName(tenantId);
    const exists = await this.client.bucketExists(name);
    if (!exists) {
      await this.client.makeBucket(name, 'us-east-1');
    }
  }

  async upload(tenantId: string, key: string, buffer: Buffer): Promise<string> {
    await this.ensureBucket(tenantId);
    const name = this.bucketName(tenantId);
    await this.client.putObject(name, key, buffer);
    return key;
  }

  async getSignedUrl(tenantId: string, key: string): Promise<string> {
    await this.ensureBucket(tenantId);
    const name = this.bucketName(tenantId);
    return this.signingClient.presignedGetObject(name, key, 60 * 60);
  }

  async delete(tenantId: string, key: string): Promise<void> {
    const name = this.bucketName(tenantId);
    await this.client.removeObject(name, key);
  }

  async uploadAsset(tenantId: string, key: string, buffer: Buffer, metadata?: { 'Content-Type'?: string }): Promise<string> {
    await this.ensureBucket(tenantId);
    await this.client.putObject(this.bucketName(tenantId), key, buffer, undefined, metadata);
    return key;
  }

  async getAsset(tenantId: string, key: string): Promise<NodeJS.ReadableStream> {
    return this.client.getObject(this.bucketName(tenantId), key);
  }

  async deleteAsset(tenantId: string, key: string): Promise<void> {
    await this.client.removeObject(this.bucketName(tenantId), key);
  }

  async deleteByPrefix(tenantId: string, prefix: string): Promise<void> {
    const name = this.bucketName(tenantId);
    const objectsList = await this.listObjects(tenantId, prefix);
    const objects = objectsList.map((o) => o.name);
    if (objects.length > 0) {
      await this.client.removeObjects(name, objects);
    }
  }

  private async listObjects(tenantId: string, prefix: string): Promise<{ name: string }[]> {
    const name = this.bucketName(tenantId);
    const objects: { name: string }[] = [];
    const stream = this.client.listObjects(name, prefix, true);
    return new Promise((resolve, reject) => {
      stream.on('data', (obj: { name?: string }) => objects.push({ name: obj.name ?? '' }));
      stream.on('error', reject);
      stream.on('end', () => resolve(objects));
    });
  }
}
