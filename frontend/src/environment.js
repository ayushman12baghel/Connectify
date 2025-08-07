let IS_PROD = process.env.NODE_ENV === "production";
const server = IS_PROD ?
    "/api" :
    "http://localhost:8000"

export default server;