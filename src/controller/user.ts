import { Router, Request, Response, NextFunction } from "express";
import { User } from "../models/UserModel";
import { ModifiedObjectModel } from "../models/ModifiedObject";
import { authenticateJWT } from "../middleware/auth";
import { validate } from "../middleware/validation";
import {
  updateInvitationSchema,
  type UpdateInvitationBody,
} from "../validators/user.validator";
import { getThemeConfig, getThemeColors, getThemeWeather, getThemeName } from "../config/theme-config";
import { createDefaultModifiedObjects, hasValidDefaultObjectConfig } from "../services/theme-default-object.service";

export const userRouter = Router();

// PATCH /users/invitation - Update user invitation
userRouter.patch(
  "/invitation",
  authenticateJWT,
  validate(updateInvitationSchema),
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const body: UpdateInvitationBody = req.body;
      const { invitation } = body;
      const userId = req.user!.id;

      // Find user and update invitation
      const user = await User.findByIdAndUpdate(
        userId,
        { invitation: invitation === "" ? null : invitation },
        { new: true, runValidators: true }
      ).exec();

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      res.status(200).json({
        message: "초대 문구가 성공적으로 업데이트되었습니다.",
        invitation: user.invitation || null,
      });
    } catch (error) {
      console.error("Error updating invitation:", error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }
);

// PUT /user/theme/:themeId - Update user's theme
userRouter.put(
  "/theme/:themeId",
  authenticateJWT,
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const themeId = parseInt(req.params.themeId, 10);

      // Validate themeId
      if (isNaN(themeId) || themeId < 1 || themeId > 5) {
        return res.status(400).json({
          success: false,
          message: "Invalid theme ID. Must be between 1 and 5."
        });
      }

      // Get theme configuration
      const themeConfig = getThemeConfig(themeId);
      if (!themeConfig) {
        return res.status(404).json({
          success: false,
          message: "Theme not found"
        });
      }

      const themeColors = getThemeColors(themeId);
      const themeWeather = getThemeWeather(themeId);
      const themeName = getThemeName(themeId);

      // Get current user to check for previous theme
      const currentUser = await User.findById(userId).exec();
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      // Remove previous theme's default object IDs if theme is changing
      let removedObjectsCount = 0;
      if (currentUser.themeId && currentUser.themeId !== themeId) {
        // Get the previous theme's original object IDs from config
        const previousThemeConfig = getThemeConfig(currentUser.themeId);
        
        if (previousThemeConfig && previousThemeConfig.defaultModifiedObjects.length > 0) {
          // Get the original object IDs from the previous theme config
          const objectIdsToRemove = previousThemeConfig.defaultModifiedObjects.map(
            obj => obj.originalObjectId
          );

          // Remove these IDs directly from user's modifiedObjectIds array
          const result = await User.findByIdAndUpdate(
            userId,
            { $pull: { modifiedObjectIds: { $in: objectIdsToRemove } } },
            { new: true }
          ).exec();

          if (result) {
            removedObjectsCount = objectIdsToRemove.length;
            console.log(`🗑️  Removed ${removedObjectsCount} default object IDs from previous theme ${currentUser.themeId}`);
          }
        }
      }

      // Create default modified objects for this theme
      let defaultObjectIds: any[] = [];
      let defaultObjectsAdded = 0;

      if (hasValidDefaultObjectConfig(themeId)) {
        const result = await createDefaultModifiedObjects(themeId, userId);
        
        if (result.success && result.modifiedObjectIds && result.modifiedObjectIds.length > 0) {
          defaultObjectIds = result.modifiedObjectIds;
          defaultObjectsAdded = defaultObjectIds.length;
          
          console.log(`✅ Created ${defaultObjectsAdded} default objects for theme ${themeId}`);
        } else {
          console.warn(`⚠️ Failed to create default objects for theme ${themeId}:`, result.error);
        }
      }

      // Update user with themeId, theme colors, weather, and add default objects
      const updateData: any = {
        themeId: themeId
      };

      if (defaultObjectIds.length > 0) {
        updateData.$addToSet = { modifiedObjectIds: { $each: defaultObjectIds } };
      }

      if (themeColors) {
        updateData['theme.floorColor'] = themeColors.floorColor;
        updateData['theme.leftWallColor'] = themeColors.leftWallColor;
        updateData['theme.rightWallColor'] = themeColors.rightWallColor;
      }

      if (themeWeather) {
        updateData['theme.weather'] = themeWeather;
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).exec();

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      console.log(`✅ Updated theme for user ${userId} to theme ${themeId}`);

      // Return response matching API documentation format
      res.status(200).json({
        success: true,
        message: "Theme updated successfully.",
        data: {
          themeId: themeId,
          name: themeName || themeConfig.name,
          colors: themeColors || {
            floorColor: updatedUser.theme.floorColor,
            leftWallColor: updatedUser.theme.leftWallColor,
            rightWallColor: updatedUser.theme.rightWallColor
          },
          weather: themeWeather || updatedUser.theme.weather,
          previousThemeObjectsRemoved: removedObjectsCount,
          defaultObjectsAdded: defaultObjectsAdded
        }
      });
    } catch (error) {
      console.error("Error updating theme:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
);
