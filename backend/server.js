const express = require('express')
const app = express();
const port = process.env.PORT || 8080;
const cors = require('cors')
const routes = require('./routes');

routes(app);

app.use(cors());
app.listen(port, function() {
   console.log('Server started on port: ' + port);
});
