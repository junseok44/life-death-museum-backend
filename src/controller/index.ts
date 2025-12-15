import { Application } from "express";
import { signupRouter, loginRouter, profileRouter, verifyRouter } from "./auth";
import { objectRouter } from "./object";
import { modifiedRouter } from "./modified";
import { onboardingRouter } from "./onboarding";
import { themeOnboardingRouter } from "./themeOnboarding";
import { userRouter } from "./user";
import { qrcodeRouter } from "./qrcode";

export const setupRoutes = (app: Application): void => {
  // Auth routes
  app.use("/auth/signup", signupRouter);
  app.use("/auth/login", loginRouter);
  app.use("/auth/profile", profileRouter);
  app.use("/auth/verify", verifyRouter);

  // onboarding route
  app.use("/onboarding", onboardingRouter);
  app.use("/onboarding/theme", themeOnboardingRouter);

  // Object routes
  app.use("/object", objectRouter);

  // Modified routes
  app.use("/modified", modifiedRouter);

  // User routes
  app.use("/users", userRouter);

  // QR Code route
  app.use("/capture-and-generate-qr", qrcodeRouter);

  // Add more routes here
  // app.use('/api/posts', postRouter);
};
