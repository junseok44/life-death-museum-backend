import { Application } from "express";
import { exampleRouter } from "./_example";
import { signupRouter, loginRouter, profileRouter, verifyRouter } from "./auth";
import { objectRouter } from "./object";
import { modifiedRouter } from "./modified";
import { onboardingRouter } from "./onboarding";

export const setupRoutes = (app: Application): void => {
  // API routes
  app.use("/api/example", exampleRouter);

  // Auth routes
  app.use("/auth/signup", signupRouter);
  app.use("/auth/login", loginRouter);
  app.use("/auth/profile", profileRouter);
  app.use("/auth/verify", verifyRouter);

  // onboarding route
  app.use("/onboarding", onboardingRouter);

  // Object routes
  app.use("/object", objectRouter);

  // Modified routes
  app.use("/modified", modifiedRouter);

  // Add more routes here
  // app.use('/api/users', userRouter);
  // app.use('/api/posts', postRouter);
};
