require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const routes = require('./routes/routes');

const PORT = process.env.PORT || 5000;

const app = express();

// Connect Database
connectDB();

const sess = {
  secret: process.env.SESSION_SECRET,
  cookie: { maxAge: 365 * 24 * 60 * 60 * 1000 },
  resave: false,
  saveUninitialized: true
};

if (app.get('env') === 'production') {
  sess.cookie.secure = true; // If running a production test, comment this out
  sess.cookie.httpOnly = true;
  sess.store = new MongoStore({ mongooseConnection: mongoose.connection });
}

app.use(session(sess));

// Init middleware
app.use(express.json({ extended: false }));

// Routes
app.use('/', routes);

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
