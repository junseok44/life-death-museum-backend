/**
 * Service for creating theme-specific default modified objects
 * 
 * When a user is assigned a theme, this service creates a default modified object
 * based on the theme configuration and adds it to their museum.
 */

import { ModifiedObjectModel, ModifiedObject } from '../models/ModifiedObject';
import { ImageObject } from '../models/ObjectModel';
import { THEME_CONFIGS, ThemeConfig } from '../config/theme-config';
import { ObjectId } from 'mongoose';

export interface CreateDefaultObjectResult {
  success: boolean;
  modifiedObjectId?: ObjectId;
  error?: string;
}

/**
 * Creates a default modified object for a given theme
 * 
 * @param themeId - The theme ID (1-5)
 * @param userId - The user ID who owns this object (can be string or ObjectId)
 * @returns Result with the created modified object ID
 */
export async function createDefaultModifiedObject(
  themeId: number,
  userId: string | ObjectId
): Promise<CreateDefaultObjectResult> {
  try {
    // Get theme configuration
    const themeConfig: ThemeConfig | undefined = THEME_CONFIGS[themeId];
    
    if (!themeConfig) {
      return {
        success: false,
        error: `Invalid theme ID: ${themeId}`
      };
    }

    const defaultObjectConfig = themeConfig.defaultModifiedObject;

    // Check if placeholder data is still being used
    if (defaultObjectConfig.originalObjectId.startsWith('PLACEHOLDER_')) {
      console.warn(`⚠️ Theme ${themeId} is using placeholder object ID. Skipping default object creation.`);
      return {
        success: false,
        error: 'Theme configuration not finalized. Awaiting product team data.'
      };
    }

    // Fetch the original object from the database
    const originalObject = await ImageObject.findById(defaultObjectConfig.originalObjectId);

    if (!originalObject) {
      return {
        success: false,
        error: `Original object not found: ${defaultObjectConfig.originalObjectId}`
      };
    }

    console.log(`📦 Creating default modified object for theme ${themeId} (${themeConfig.name})`);

    // Create the modified object based on the original
    const modifiedObject = new ModifiedObjectModel({
      // Copy properties from original object
      name: originalObject.name,
      description: originalObject.description,
      currentImageSet: originalObject.currentImageSet,
      imageSets: originalObject.imageSets,
      isUserMade: false, // This is a theme-provided default object
      onType: originalObject.onType,

      // Add modification properties from theme config
      coordinates: defaultObjectConfig.coordinates,
      isReversed: defaultObjectConfig.isReversed,
      itemFunction: defaultObjectConfig.itemFunction,
      additionalData: {
        ...defaultObjectConfig.additionalData,
        originalObjectId: originalObject._id,
        userId: userId,
        createdByTheme: themeId,
        isDefaultObject: true
      }
    });

    // Save the modified object
    const savedObject = await modifiedObject.save();

    console.log(`✅ Created default modified object: ${savedObject._id}`);

    return {
      success: true,
      modifiedObjectId: savedObject._id
    };

  } catch (error) {
    console.error('❌ Error creating default modified object:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if a theme has a valid default object configuration
 * (i.e., not using placeholder data)
 * 
 * @param themeId - The theme ID to check
 * @returns True if the theme has real data, false if using placeholders
 */
export function hasValidDefaultObjectConfig(themeId: number): boolean {
  const themeConfig = THEME_CONFIGS[themeId];
  if (!themeConfig) {
    return false;
  }
  
  return !themeConfig.defaultModifiedObject.originalObjectId.startsWith('PLACEHOLDER_');
}
