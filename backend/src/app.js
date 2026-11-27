import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import env from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';
import { notFound } from './middlewares/notFound.middleware.js';
import routes from './routes/index.js';

/**
 * Builds the Express app without starting it, so tests can import it
 * without opening a port. server.js does the listening.
 */
const app = express();

app.use(helmet());
// credentials: true lets the browser send and receive cookies on requests from the frontend's origin.
app.use(cors({ origin: env.corsOrigins, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser()); // fills req.cookies
app.use(morgan(env.isProduction ? 'combined' : 'dev'));

app.use('/api', routes);

// These two must come last.
app.use(notFound);
app.use(errorHandler);

export default app;
