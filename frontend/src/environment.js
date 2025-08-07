let IS_PROD = process.env.NODE_ENV === "production";
const server = IS_PROD ?
    "https://your-railway-url.up.railway.app" : // Replace with your actual Railway URL
    "http://localhost:8000"

export default server;