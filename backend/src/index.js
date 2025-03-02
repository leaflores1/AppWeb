import { httpServer } from './app.js';
import { PORT } from './config.js';
import { connectDB } from './db.js';

async function main() {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`Listening on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error(error);
  }
}

main();