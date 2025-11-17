import { Application } from "express";
import { exampleRouter } from "./example";
import { signupRouter, loginRouter } from "./auth";
  
export const setupRoutes = (app: Application): void => {
  // API routes
  app.use("/api/example", exampleRouter);
  app.use("/auth/signup", signupRouter);
  app.use("/auth/login", loginRouter);

  // Add more routes here
  // app.use('/api/users', userRouter);
  // app.use('/api/posts', postRouter);
};
