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
  modifiedObjectIds?: ObjectId[];  // Changed to array for multiple objects
  error?: string;
}

/**
 * Creates 2 default modified objects for a given theme
 * 
 * @param themeId - The theme ID (1-5)
 * @param userId - The user ID who owns these objects (can be string or ObjectId)
 * @returns Result with the created modified object IDs
 */
export async function createDefaultModifiedObjects(
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

    const defaultObjectConfigs = themeConfig.defaultModifiedObjects;

    // Check if placeholder data is still being used (check first object)
    if (defaultObjectConfigs[0].originalObjectId.startsWith('PLACEHOLDER_')) {
      console.warn(`⚠️ Theme ${themeId} is using placeholder object IDs. Skipping default objects creation.`);
      return {
        success: false,
        error: 'Theme configuration not finalized. Awaiting product team data.'
      };
    }

    console.log(`📦 Creating default modified objects for theme ${themeId} (${themeConfig.name})`);

    const createdObjectIds: ObjectId[] = [];

    // Create each default object
    for (let i = 0; i < defaultObjectConfigs.length; i++) {
      const config = defaultObjectConfigs[i];
      
      // Fetch the original object from the database
      const originalObject = await ImageObject.findById(config.originalObjectId);

      if (!originalObject) {
        console.error(`❌ Original object not found: ${config.originalObjectId}`);
        continue; // Skip this object but try the others
      }

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
        coordinates: config.coordinates,
        isReversed: config.isReversed,
        itemFunction: config.itemFunction,
        additionalData: {
          ...config.additionalData,
          originalObjectId: originalObject._id,
          userId: userId,
          createdByTheme: themeId,
          isDefaultObject: true,
          objectIndex: i
        }
      });

      // Save the modified object
      const savedObject = await modifiedObject.save();
      createdObjectIds.push(savedObject._id);
      
      console.log(`✅ Created default modified object ${i + 1}/2: ${savedObject._id}`);
    }

    if (createdObjectIds.length === 0) {
      return {
        success: false,
        error: 'Failed to create any default objects'
      };
    }

    return {
      success: true,
      modifiedObjectIds: createdObjectIds
    };

  } catch (error) {
    console.error('❌ Error creating default modified objects:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if a theme has valid default object configurations
 * (i.e., not using placeholder data)
 * 
 * @param themeId - The theme ID to check
 * @returns True if the theme has real data, false if using placeholders
 */
export function hasValidDefaultObjectConfig(themeId: number): boolean {
  const themeConfig = THEME_CONFIGS[themeId];
  if (!themeConfig || !themeConfig.defaultModifiedObjects || themeConfig.defaultModifiedObjects.length === 0) {
    return false;
  }
  
  // Check if any object is using placeholder
  return !themeConfig.defaultModifiedObjects[0].originalObjectId.startsWith('PLACEHOLDER_');
}
