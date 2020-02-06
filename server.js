const express = require('express');
const app = express();
const port = process.env.PORT || 9000;
const connectDB = require('./server/models/db');

// Make DB Connection
connectDB();

// Middleware
app.use(express.json({ extended: false }));
app.listen(port, () => console.log(`Server started on port ${port}`));

// Routes
app.get('/', (req, res) => res.send('API successfully running...'));
app.use('/api/users', require('./server/routes/api/users'));
app.use('/api/auth', require('./server/routes/api/auth'));
app.use('/api/profile', require('./server/routes/api/profile'));
app.use('/api/posts', require('./server/routes/api/posts'));
