let IS_PROD = process.env.NODE_ENV === "production";
const server = IS_PROD ?
    "/api/v1" :
    "http://localhost:8000/api/v1"

export default server;