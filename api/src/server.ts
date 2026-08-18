import { createServer } from "http";
import { env } from "./config/env";
import { createApp } from "./app";
import { initSocketIO } from "./sockets";

const app = createApp();
const httpServer = createServer(app);

initSocketIO(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`🚀 EventDrop API listening on http://localhost:${env.PORT}`);
  console.log(`   Environment: ${env.NODE_ENV}`);
});
