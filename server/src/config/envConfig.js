import dotenv from 'dotenv';

dotenv.config();

export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
export const CORS_ORIGIN = process.env.CORS_ORIGIN;
export const PORT = process.env.PORT
export const JWT_SECRET = process.env.JWT_SECRET
