import { Application } from "express";
import { exampleRouter } from "./example";
import { signupRouter, loginRouter, profileRouter, verifyRouter } from "./auth";
import { protectedRouter } from "./protected";
  
export const setupRoutes = (app: Application): void => {
  // API routes
  app.use("/api/example", exampleRouter);
  
  // Auth routes
  app.use("/auth/signup", signupRouter);
  app.use("/auth/login", loginRouter);
  app.use("/auth/profile", profileRouter);
  app.use("/auth/verify", verifyRouter);

  // Protected routes examples
  app.use("/api/protected", protectedRouter);

  // Add more routes here
  // app.use('/api/users', userRouter);
  // app.use('/api/posts', postRouter);
};
