import {z} from "zod";

export const registerSchema = z.object({
  name: z.string().min(3, "Name must be atleast 3 character long"),
  email: z.string().check(z.email({message: "Invalid email format"})),
  password: z.string().min(8, "Password must be atleast 8 characters long")
}); 

export const loginSchema = z.object({
  email: z.string().check(z.email({message: "Please enter the valid email format"})),
  password: z.string().min(8, "Please enter the valid password")
});