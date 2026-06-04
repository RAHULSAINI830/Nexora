import { app } from "./app.js";
import { config } from "./config.js";
import { initializeDatabase } from "./db.js";

await initializeDatabase();

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
