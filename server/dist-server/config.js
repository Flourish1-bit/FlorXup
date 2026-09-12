import 'dotenv/config';
const port = Number(process.env.PORT || 4000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port.');
}
const jwtSecret = process.env.JWT_SECRET || 'development-only-change-me';
if (jwtSecret === 'development-only-change-me' && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured in production.');
}
export const config = {
    port,
    host: process.env.HOST || '0.0.0.0',
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    dataFile: process.env.DATA_FILE || 'data/backend.json',
    requireEmailVerification: process.env.AUTH_REQUIRE_EMAIL_VERIFICATION === 'true',
};
