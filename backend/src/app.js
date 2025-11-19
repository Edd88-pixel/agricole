import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { requestLogger } from './middlewares/loggerMiddleware.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use(routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
