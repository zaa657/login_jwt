import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type AuthRequest = Request & {
    user?: {
        id: number;
        username: string;
    };
};

const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET || "rahasia_super_aman";

export const authenticateToken = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers.authorization;
    const bearerMatch = authHeader
        ? /^Bearer\s+(\S+)$/i.exec(authHeader)
        : null;

    if (!bearerMatch) {
        res.status(401).json({
            success: false,
            message: authHeader
                ? "Format token harus Bearer <token>"
                : "Anda belum login"
        });
        return;
    }

    try {
        const decoded = jwt.verify(bearerMatch[1], JWT_SECRET);

        if (typeof decoded === "string" || typeof decoded.id !== "number" || typeof decoded.username !== "string") {
            res.status(401).json({
                success: false,
                message: "Token tidak valid"
            });
            return;
        }

        req.user = {
            id: decoded.id,
            username: decoded.username
        };
        next();
    } catch {
        res.status(401).json({
            success: false,
            message: "Token tidak valid atau sudah expired"
        });
    }
};