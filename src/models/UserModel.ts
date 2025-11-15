import mongoose, { Schema, Document, Model } from "mongoose";

export interface Theme {
    floorColor: string;
    wallColor: string;
    weather: "sunny" | "raining" | "cloudy" | "snowing" | "night" | "sunset";
}

export interface User extends Document {
  name: string;
  email: string;
  password: string;
  theme: Theme;
  invitation?: string;
  objectIds: string[];
  modifiedObjectIds: string[];
  createdAt: Date;
}

// User schema
const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
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
    theme: {
      floorColor: { type: String, required: true },
      wallColor: { type: String, required: true },
      weather: {
        type: String,
        enum: ["sunny", "raining", "cloudy", "snowing", "night", "sunset"],
        required: true,
      },
    },
    invitation: {
      type: String,
      trim: true,
    },
    objectIds: {
      type: [String],
      default: [],
    },
    modifiedObjectIds: {
      type: [String],
      default: [],
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
export const User: Model<User> = mongoose.model<User>(
  "User",
  UserSchema
);

