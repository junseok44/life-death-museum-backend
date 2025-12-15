import { Router, Request, Response, NextFunction } from "express";
import QRCode from "qrcode";
import { authenticateJWT } from "../middleware/auth";
import { User } from "../models/UserModel";
import { storage } from "../services/storage";
import { ImageConverter } from "../utils/imageConverter";

export const qrcodeRouter = Router();

/**
 * POST /capture-and-generate-qr
 *
 * Receives a base64 encoded image from the frontend, saves it to storage,
 * stores the URL in the user's capturedImages array, generates a QR code
 * pointing to that image URL, saves the QR code to storage, and returns both URLs.
 *
 * Request body:
 * - captured_image_data (required): Base64 encoded image data
 * - metadata (optional): Additional metadata about the capture
 *
 * Response:
 * - qr_code_url: URL of the stored QR code image
 * - capture_image_url: URL of the stored captured image
 * - capturedAt: Timestamp of when the capture was processed
 */
qrcodeRouter.post(
  "/",
  authenticateJWT,
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { captured_image_data, metadata } = req.body;

      // Validate required fields
      if (!captured_image_data) {
        return res.status(400).json({
          success: false,
          message: "captured_image_data is required",
        });
      }

      console.log(`📸 Processing captured image for user ${userId}`);

      // Convert base64 to buffer
      const { buffer, mimeType } =
        ImageConverter.base64ToBuffer(captured_image_data);

      // Generate unique filename
      const timestamp = Date.now();
      const extension = mimeType.split("/")[1] || "png";
      const storagePath = `captures/${userId}/${timestamp}.${extension}`;

      // Upload to storage
      const capturedImageUrl = await storage.uploadFromBuffer(
        buffer,
        storagePath,
        mimeType
      );
      console.log(`✅ Uploaded captured image to: ${capturedImageUrl}`);

      // Save to user's capturedImages array
      const user = await User.findByIdAndUpdate(
        userId,
        {
          $push: {
            capturedImages: {
              url: capturedImageUrl,
              capturedAt: new Date(),
              metadata: metadata || {},
            },
          },
        },
        { new: true }
      ).exec();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      console.log(`💾 Saved captured image URL to user ${userId}`);

      // Generate QR code pointing to the captured image URL
      const qrOptions = {
        errorCorrectionLevel: "H" as const, // High error correction
        type: "png" as const,
        margin: 1,
        width: 512, // Size of the QR code image
        color: {
          dark: "#000000", // QR code color
          light: "#FFFFFF", // Background color
        },
      };

      // Generate QR code as buffer
      const qrCodeBuffer = await QRCode.toBuffer(capturedImageUrl, qrOptions);
      console.log(`✅ Generated QR code buffer for captured image`);

      // Upload QR code to storage
      const qrCodeStoragePath = `qr/qr_${userId}_${timestamp}.png`;
      const qrCodeImageUrl = await storage.uploadFromBuffer(
        qrCodeBuffer,
        qrCodeStoragePath,
        "image/png"
      );
      console.log(`✅ Uploaded QR code to: ${qrCodeImageUrl}`);

      // Return the QR code URL and captured image URL
      res.status(200).json({
        success: true,
        message: "Captured image saved and QR code generated successfully",
        data: {
          capture_image_url: capturedImageUrl,
          qr_code_url: qrCodeImageUrl,
          capturedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error processing capture and generating QR code:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process captured image and generate QR code",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);
