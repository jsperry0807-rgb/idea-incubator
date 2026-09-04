import { SignJWT, jwtVerify } from "jose";

import { env } from "../config/env";

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

const accessSecret = new TextEncoder().encode(env.ACCESS_TOKEN_SECRET);
const refreshSecret = new TextEncoder().encode(env.REFRESH_TOKEN_SECRET);

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT(
    payload as unknown as import("jose").JWTPayload,
  )
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.ACCESS_TOKEN_TTL)
    .sign(accessSecret);
}

export async function signRefreshToken(payload: RefreshTokenPayload): Promise<string> {
  return new SignJWT(
    payload as unknown as import("jose").JWTPayload,
  )
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${env.REFRESH_TOKEN_TTL_DAYS}d`)
    .sign(refreshSecret);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, accessSecret);
  return { sub: String(payload.sub), email: String(payload.email) };
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, refreshSecret);
  return { sub: String(payload.sub), jti: String(payload.jti) };
}
