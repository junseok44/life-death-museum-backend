import { StorageInterface } from "../types/storage";
import { MockStorage } from "./mock-storage";
import { S3Storage } from "./s3-storage";

/**
 * Storage service instance
 *
 * Uses S3Storage if AWS credentials are configured, otherwise falls back to MockStorage
 * Set STORAGE_TYPE='s3' to force S3 usage (will throw error if credentials missing)
 * Set STORAGE_TYPE='mock' to force MockStorage usage
 */
let storageInstance: StorageInterface;

const storageType = process.env.STORAGE_TYPE?.toLowerCase() || "auto";

if (storageType === "s3") {
  // Force S3 usage
  storageInstance = new S3Storage();
} else if (storageType === "mock") {
  // Force MockStorage usage
  storageInstance = new MockStorage(
    process.env.STORAGE_BASE_URL || "https://mock-storage.example.com"
  );
} else {
  // Auto: Use S3 if credentials are available, otherwise MockStorage
  try {
    if (
      process.env.AWS_REGION &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.S3_BUCKET_NAME
    ) {
      storageInstance = new S3Storage();
      console.log("Using S3Storage for file uploads");
    } else {
      storageInstance = new MockStorage(
        process.env.STORAGE_BASE_URL || "https://mock-storage.example.com"
      );
      console.log(
        "Using MockStorage for file uploads (AWS credentials not configured)"
      );
    }
  } catch (error) {
    console.warn(
      "Failed to initialize S3Storage, falling back to MockStorage:",
      error
    );
    storageInstance = new MockStorage(
      process.env.STORAGE_BASE_URL || "https://mock-storage.example.com"
    );
  }
}

export const storage: StorageInterface = storageInstance;
