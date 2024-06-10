const express = require("express");
const https = require('https');
const path = require('path');
const fs = require('fs');
const cors = require("cors");

require('./config/db');
const UserRouter = require('./api/User');
const app = express();
const PORT = process.env.PORT;

app.use(cors());

// Middleware to parse JSON bodies
const bodyParser = express.json();
app.use(bodyParser);

// app.post('/user/api/signin', UserRouter, (req, res) => {


// })

app.use('/user', UserRouter)

app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.html'))
})

//Configuration of SSL certificate 
const sslServer = https.createServer({
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'cert.pem'))
}, app)



sslServer.listen(PORT, () => {
    console.log(`Secure Server is running on port ${PORT}`);
});
