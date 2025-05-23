// Middleware for JWT authentication (to protect routes)
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
      if (err) return res.sendStatus(403);
      (req as any).user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
}
