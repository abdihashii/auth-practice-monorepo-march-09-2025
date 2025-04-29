import AWS from 'aws-sdk';

import env from '@/env';

interface ImageUploadConfig {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  signatureVersion?: string;
  region?: string;
}

export class ImageUploadService {
  private s3Client: AWS.S3;
  private bucketName: string;

  constructor(config: ImageUploadConfig) {
    this.s3Client = new AWS.S3({
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      signatureVersion: config.signatureVersion ?? 'v4',
      region: config.region ?? 'auto',
    });
    this.bucketName = config.bucketName;
  }

  async uploadImage(
    fileContent: ArrayBuffer,
    objectKey: string,
    contentType: string,
  ) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: objectKey,
        Body: fileContent,
        ContentType: contentType,
      };

      const data = await this.s3Client.putObject(params).promise();

      return data;
    } catch (error) {
      console.error('Error uploading image', error);
      throw error; // Re-throw for method caller
    }
  }

  async getImageUrl(objectKey: string) {
    try {
      const response = await this.s3Client.getSignedUrlPromise('getObject', {
        Bucket: this.bucketName,
        Key: objectKey,
        Expires: 60 * 5, // 5 minutes in seconds
      });

      return response;
    } catch (error) {
      console.error('Error getting image URL', error);
      throw error; // Re-throw for method caller
    }
  }
}

export const imageUploadService = new ImageUploadService({
  endpoint: env.R2_ENDPOINT,
  accessKeyId: env.R2_ACCESS_KEY_ID,
  secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  bucketName: env.R2_BUCKET_NAME,
  signatureVersion: 'v4',
  region: 'auto',
});
