import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { StorageInterface } from "../types/storage";

/**
 * AWS S3 storage implementation
 * Requires the following environment variables:
 * - AWS_REGION: AWS region (e.g., 'us-east-1')
 * - AWS_ACCESS_KEY_ID: AWS access key ID
 * - AWS_SECRET_ACCESS_KEY: AWS secret access key
 * - S3_BUCKET_NAME: S3 bucket name
 */
export class S3Storage implements StorageInterface {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    this.bucketName = process.env.S3_BUCKET_NAME || "";

    if (!region) {
      throw new Error("AWS_REGION environment variable is required");
    }
    if (!accessKeyId) {
      throw new Error("AWS_ACCESS_KEY_ID environment variable is required");
    }
    if (!secretAccessKey) {
      throw new Error("AWS_SECRET_ACCESS_KEY environment variable is required");
    }
    if (!this.bucketName) {
      throw new Error("S3_BUCKET_NAME environment variable is required");
    }

    // Initialize S3 client
    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadFromBuffer(
    buffer: Buffer,
    path: string,
    mimeType: string
  ): Promise<string> {
    try {
      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: path,
        Body: buffer,
        ContentType: mimeType,
      });

      await this.s3Client.send(command);

      // Return standard S3 URL
      return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${path}`;
    } catch (error) {
      console.error("S3 upload error:", error);
      throw new Error(
        `Failed to upload file to S3: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}
