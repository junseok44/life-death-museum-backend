import { Application } from "express";
import { exampleRouter } from "./example";
import { signupRouter } from "./signup";
  
export const setupRoutes = (app: Application): void => {
  // API routes
  app.use("/api/example", exampleRouter);
  app.use("/api/signup", signupRouter);

  // Add more routes here
  // app.use('/api/users', userRouter);
  // app.use('/api/posts', postRouter);
};
