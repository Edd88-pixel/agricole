import app from './src/app.js';
import { config } from './src/config/env.js';

const { port } = config;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend API running on port ${port}`);
});
