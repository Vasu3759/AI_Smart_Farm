const app = require('./app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;



// Connect to Database
connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to connect to database. Server not started.', err);
  process.exit(1);
});
