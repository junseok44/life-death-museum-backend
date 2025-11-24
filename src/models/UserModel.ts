import mongoose, { Schema, Document, Model, ObjectId } from "mongoose";

export interface Theme {
  floorColor: string;
  wallColor: string;
  weather: "sunny" | "raining" | "cloudy" | "snowing" | "night" | "sunset";
}

export interface User extends Document {
  _id: ObjectId;
  name?: string;
  email: string;
  password: string;
  theme: Theme;
  invitation?: string;
  objectIds: ObjectId[];
  modifiedObjectIds: ObjectId[];
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
      type: [Schema.Types.ObjectId],
      default: [],
    },
    modifiedObjectIds: {
      type: [Schema.Types.ObjectId],
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
