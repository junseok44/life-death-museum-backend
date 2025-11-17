import mongoose, { Schema, Document, Model } from "mongoose";
import { ImageObject, ImageObjectSchema } from "./ObjectModel";

export interface ImageCoords {
  x: number;
  y: number;
}

// Example interface
export interface ModifiedObject extends Document, ImageObject {
  itemFunction: "Gallery" | "Link" | "Board" | "None";
  additionalData?: any;
  coordinates: ImageCoords;
}

// Example schema
const ModifiedObjectSchema: Schema = new Schema(
    Object.assign({}, ImageObjectSchema.obj, {
        itemFunction: {
            type: String,
            enum: ["Gallery", "Link", "Board", "None"],
            required: true,
            trim: true,
        },
        additionalData: { type: Schema.Types.Mixed },
        coordinates: {
            x: { type: Number, required: true },
            y: { type: Number, required: true },
        },
    }),
    { timestamps: true }
);

export const ModifiedObjectModel: Model<ModifiedObject> =
    mongoose.model<ModifiedObject>("ModifiedObject", ModifiedObjectSchema);

