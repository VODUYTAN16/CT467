import express from 'express';
import morgan from 'morgan';
import cors from 'cors';

import memberRoutes from './app/routes/members.routes.js';
import packageRoutes from './app/routes/packages.routes.js';
import subscriptionRoutes from './app/routes/subscriptions.routes.js';
import equipmentRoutes from './app/routes/equipment.routes.js';
import usageRoutes from './app/routes/usage.routes.js';
import paymentRoutes from './app/routes/payments.routes.js';
import reportRoutes from './app/routes/reports.routes.js';
import authRoutes from './app/routes/auth.routes.js';
import userRoutes from './app/routes/users.routes.js';

import errorHandler from './app/middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/usages', usageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);

app.use(errorHandler);

export default app;
