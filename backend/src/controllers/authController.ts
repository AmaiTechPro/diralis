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
    const {
      fullName,
      username,
      email,
      password,
    } = req.body;

    const result = await registerUser(
      fullName,
      username,
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
    const {
      identifier,
      password,
    } = req.body;

    const result = await loginUser(
      identifier,
      password
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(401).json({
      error: (error as Error).message,
    });
  }
}


