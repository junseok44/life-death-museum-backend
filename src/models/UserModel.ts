import mongoose, { Schema, Document, Model, ObjectId } from "mongoose";
import { Theme } from "../types";

export interface CapturedImage {
  url: string;
  capturedAt: Date;
  metadata?: any;
}

export interface User extends Document {
  _id: ObjectId;
  name?: string;
  email: string;
  password: string;
  themeId?: number;
  theme: Theme;
  invitation?: string;
  objectIds: ObjectId[];
  modifiedObjectIds: ObjectId[];
  capturedImages: CapturedImage[];
  createdAt: Date;
  questionIndex: number;
}

// User schema
const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    themeId: {
      type: Number,
      min: 1,
      max: 5,
    },
    theme: {
      floorColor: { type: String, required: true },
      leftWallColor: { type: String, required: true },
      rightWallColor: { type: String, required: true },
      weather: {
        type: String,
        enum: ["sunny", "raining", "cloudy", "snowing", "night", "sunset"],
        required: true,
      },
      backgroundMusic: {
        url: { type: String, required: true },
        name: { type: String, required: true },
      },
    },
    invitation: {
      type: String,
      trim: true,
    },
    objectIds: {
      type: [Schema.Types.ObjectId],
      default: [],
    },
    modifiedObjectIds: {
      type: [Schema.Types.ObjectId],
      default: [],
    },
    capturedImages: {
      type: [
        {
          url: { type: String, required: true },
          capturedAt: { type: Date, required: true },
          metadata: { type: Schema.Types.Mixed },
        },
      ],
      default: [],
    },
    questionIndex: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// User model
export const User: Model<User> = mongoose.model<User>("User", UserSchema);
