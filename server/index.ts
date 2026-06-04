import { createApp } from "./createApp";
import { log } from "./vite";

(async () => {
  const { server } = await createApp();

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
