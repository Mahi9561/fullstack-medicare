import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { globalLimiter } from './middleware/rateLimiter';
import routes from './routes';

// The app is built here but never started here, so Supertest can import it without opening a port.
export const app = express();

app.use(helmet());
// credentials: true lets the browser send the httpOnly session cookie; origin must then be explicit, not "*".
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(globalLimiter);
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);
