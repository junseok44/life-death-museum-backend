import { Application } from "express";
import { exampleRouter } from "./example";

export const setupRoutes = (app: Application): void => {
  // API routes
  app.use("/api/example", exampleRouter);

  // Add more routes here
  // app.use('/api/users', userRouter);
  // app.use('/api/posts', postRouter);
};
