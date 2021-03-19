require('dotenv').config();
const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const MongoStore = require('connect-mongo')(session);
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const routes = require('./routes/routes');
const errorHandler = require('./middleware/error');

const PORT = process.env.PORT || 5000;

const app = express();

// Connect Database
connectDB();

const sess = {
  secret: process.env.SESSION_SECRET,
  cookie: { maxAge: 365 * 24 * 60 * 60 * 1000 },
  resave: false,
  saveUninitialized: true,
};

if (app.get('env') === 'production') {
  sess.proxy = true; // Comment out if using Nginx proxy with the 'X-Forwarded-Proto' header
  sess.cookie.secure = true; // If running a production test, comment this out
  sess.cookie.httpOnly = true;
  sess.store = new MongoStore({ mongooseConnection: mongoose.connection });
}

app.use(session(sess));

// Init middleware
app.use(express.json({ extended: false }));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/', routes);

app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & exit process
  server.close(() => process.exit(1));
});
