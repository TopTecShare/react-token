require("dotenv").config();
const express = require('express')
const app = express();
const port = process.env.PORT || 8080;
const cors = require('cors')
const routes = require('./routes');
const https = require('https');
const fs = require('fs');

routes(app);
app.use(cors());
/*
app.listen(port, function() {
   console.log('Server started on port: ' + port);
});
*/

const privateKey = fs.readFileSync( process.env.SSL_ROOT+"key.pem" );
const certificate = fs.readFileSync( process.env.SSL_ROOT+"cert.pem" );
const ca = fs.readFileSync( process.env.SSL_ROOT+"cert.pem" );

https.createServer({
    key: privateKey,
    cert: certificate,
    ca: ca
}, app).listen(port);
