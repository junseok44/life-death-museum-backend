import mongoose, { Schema, Document, Model } from "mongoose";

// Example interface
export interface IExample extends Document {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Example schema
const ExampleSchema: Schema = new Schema(
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
  },
  {
    timestamps: true,
  }
);

// Example model
export const Example: Model<IExample> = mongoose.model<IExample>(
  "Example",
  ExampleSchema
);

// Export models here
// export { Example, User, Post, ... };
