import crypto from "crypto";

const jwtSecret=crypto.randomBytes(64).toString("hex");
console.log("JWT Secret",jwtSecret);

const refreshToken=crypto.randomBytes(64).toString("hex");
console.log("Refresh Token",refreshToken);

console.log(crypto.randomBytes(32).toString("hex"));