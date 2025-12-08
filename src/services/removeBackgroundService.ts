/**
 * Remove Background Service
 * Handles background removal using remove.bg API
 * Requires REMOVE_BG_SERVICE_API_KEY environment variable
 */
export class RemoveBackgroundService {
  private apiKey: string;

  constructor() {
    const apiKey = process.env.REMOVE_BG_SERVICE_API_KEY;
    if (!apiKey) {
      throw new Error(
        "REMOVE_BG_SERVICE_API_KEY environment variable is required"
      );
    }
    this.apiKey = apiKey;
  }

  /**
   * Remove background from an image buffer
   * @param imageBuffer - Buffer containing the image data
   * @param mimeType - MIME type of the image (e.g., 'image/png', 'image/jpeg')
   * @returns Promise resolving to Buffer with background removed
   */
  async removeBackground(
    imageBuffer: Buffer,
    mimeType: string = "image/png"
  ): Promise<Buffer> {
    // Convert Buffer to Blob
    const blob = new Blob([imageBuffer], { type: mimeType });

    const formData = new FormData();
    formData.append("size", "auto");
    // Append blob with filename for remove.bg API
    const filename =
      mimeType.includes("jpeg") || mimeType.includes("jpg")
        ? "image.jpg"
        : "image.png";
    formData.append("image_file", blob, filename);

    const endpoint = process.env.REMOVE_BG_SERVICE_ENDPOINT || "";

    if (!endpoint) {
      throw new Error(
        "REMOVE_BG_SERVICE_ENDPOINT environment variable is required"
      );
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data" },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to remove background: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

// Export singleton instance
export const removeBackgroundService = new RemoveBackgroundService();
