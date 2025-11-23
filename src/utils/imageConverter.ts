/**
 * Image Converter Utility
 * Converts various image formats (URL, base64) to Buffer for storage upload
 */
export class ImageConverter {
  /**
   * Download image from URL and convert to Buffer
   * @param url - Image URL
   * @returns Promise resolving to buffer and mimeType
   */
  static async urlToBuffer(
    url: string
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to download image from URL: ${response.statusText}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = response.headers.get("content-type") || "image/png";

    return { buffer, mimeType };
  }

  /**
   * Convert base64 string to Buffer
   * @param base64 - Base64 encoded image string (with or without data URI prefix)
   * @returns Buffer and mimeType
   */
  static base64ToBuffer(base64: string): { buffer: Buffer; mimeType: string } {
    // Extract mimeType if present in data URI
    let mimeType = "image/png";
    let base64Data = base64;

    if (base64.startsWith("data:")) {
      const mimeMatch = base64.match(/data:(.*?);base64/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
      // Extract base64 part after "data:mimeType;base64,"
      const base64Match = base64.match(/data:.*?;base64,(.+)/);
      if (base64Match) {
        base64Data = base64Match[1];
      }
    }

    const buffer = Buffer.from(base64Data, "base64");
    return { buffer, mimeType };
  }

  /**
   * Convert image data (URL or base64) to Buffer
   * Automatically detects the format and converts accordingly
   * @param data - Image URL or base64 string
   * @returns Promise resolving to buffer and mimeType
   */
  static async toBuffer(
    data: string
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    if (data.startsWith("http://") || data.startsWith("https://")) {
      return this.urlToBuffer(data);
    } else {
      return this.base64ToBuffer(data);
    }
  }
}
