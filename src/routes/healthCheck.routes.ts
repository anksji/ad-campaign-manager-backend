import express, { Request, Response } from "express";

const router = express.Router();

router.get("/", (req: Request, res: Response) => {
  const message = "Welcome To The Ad Campaign Manager API vr:1";
  res.send({
    data: null,
    success: true,
    error: false,
    message,
    status: 200,
  });
});

export = router;
