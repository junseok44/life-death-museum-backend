import mongoose, { Schema, Document, Model, ObjectId } from "mongoose";

export interface ImageSet {
  name: string;
  color: string;
  src: string;
  _id?: ObjectId;
}

// Object interface
// Object is already defined in TS global scope, so we use ImageObject
export interface ImageObject extends Document {
  name: string;
  currentImageSet: ImageSet;
  description?: string;
  imageSets: ImageSet[];
  isUserMade: boolean;
  onType: "Wall" | "Floor";
}

// Object schema
export const ImageObjectSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    currentImageSet: {
      type: {
        name: { type: String, required: true, trim: true },
        color: { type: String, required: true, trim: true },
        src: { type: String, required: true, trim: true },
      },
      _id: false,
      required: true,
    },
    imageSets: [
      {
        name: { type: String, required: true, trim: true },
        color: { type: String, required: true, trim: true },
        src: { type: String, required: true, trim: true },
      },
    ],
    isUserMade: {
      type: Boolean,
      required: true,
      default: false,
    },
    onType: {
      type: String,
      enum: ["Wall", "Floor"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Object model
export const ImageObject: Model<ImageObject> = mongoose.model<ImageObject>(
  "ImageObject",
  ImageObjectSchema
);
