const app = require('./app')

const dotenv = require("dotenv");
const database = require('./SRC/database/db');
dotenv.config();

const port = process.env.PORT || 4000;

database()
app.listen(port, () => {
  console.log(`app is running on port ${port}`);
});