import type { Request, Response, NextFunction } from 'express';

// middleware/errorHandler.js
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    console.error("❌ Error:", err.stack || err.message);
  
    const statusCode = err.statusCode || 500;
  
    res.status(statusCode).json({
      success: false,
      message: err.message || "Internal Server Error",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
  