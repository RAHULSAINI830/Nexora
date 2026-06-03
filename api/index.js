import { app } from "../server/src/app.js";

export default function handler(req, res) {
  if (req.url?.startsWith("/api/")) {
    req.url = req.url.slice(4);
  } else if (req.url === "/api") {
    req.url = "/";
  }

  return app(req, res);
}
