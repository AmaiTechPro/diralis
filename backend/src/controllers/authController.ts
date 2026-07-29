import { Request, Response } from "express";
import {
  registerUser,
  loginUser,
} from "../services/authService";

export async function register(
  req: Request,
  res: Response
) {
  try {
    const { name, email, password } = req.body;

    const result = await registerUser(
      name,
      email,
      password
    );

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      error: (error as Error).message,
    });
  }
}

export async function login(
  req: Request,
  res: Response
) {
  try {
    const { email, password } = req.body;

    const result = await loginUser(
      email,
      password
    );

    res.json(result);
  } catch (error) {
    res.status(401).json({
      error: (error as Error).message,
    });
  }
}


