require("dotenv").config();
const express = require('express')
const app = express();
const port = process.env.PORT || 8080;
const cors = require('cors')
const routes = require('./routes');
const https = require('https');
const fs = require('fs');

routes(app);

/*
app.use(cors());
app.listen(port, function() {
   console.log('Server started on port: ' + port);
});
*/

https.createServer({
   key: fs.readFileSync('/root/certs/key.pem'),
   cert: fs.readFileSync('/root/certs/cert.pem')
}, app)
.listen(port);