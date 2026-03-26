import mongoose, {Schema, Document} from "mongoose";

export interface UserSchema extends Document{
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  createdAt: string;
  updatedAt: string;
}

const schema = new Schema<UserSchema>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    default: "user"
  },

}, {
  timestamps: true,
});

export const User = mongoose.model<UserSchema>("User", schema);