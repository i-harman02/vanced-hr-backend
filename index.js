const express = require('express');
const cors = require('cors')
const app = express()
const routs = require("./api/router");
const config = require("./config");
let { PRODUCTION_PORT } = config;
const PORT = PRODUCTION_PORT || 9000;
const swaggerDocs = require("./api/swagger/swagger");
const path = require('path');


const multer = require('multer');
const fs = require("fs");
const { put } = require("@vercel/blob");
const util = require('util');
const readFile = util.promisify(fs.readFile);


app.use(cors())
app.use(express.json())

// Database connection
require("./db/connection");




const storage = multer.memoryStorage(); // You can customize the storage as needed
const upload = multer({ storage: storage });

const options = {
  access: 'public',
  token: 'vercel_blob_rw_9QbdfSoqetuiJMDC_OHYTvZ9VfO5UZ0qaFSj5lNs9Nr77q1', // Replace with your actual Vercel Blob authentication token
};



  app.post('/api/testing', upload.single('image'), async  (req, res) => {
    // Now, req.file should contain the uploaded file information
    const { originalname, buffer } = req.file;
    // Process and handle the file here


    // const { originalname, path } = req.file;
    // const buffer = await readFile(path);
    const { url } = await put(`home/${originalname}`, buffer, options);
    console.log('Upload successful:', url);
    res.send("Working 0.2")


  });



// Authentication routes
app.use("/api", routs);

// Serve static files from the 'public' directory
// app.use(express.static(path.join(__dirname, 'public')));

// app.use(express.static("../public"));
app.use("/public", express.static("./public"));

app.listen(PORT, () => {
  console.log("Server is running..." + PORT)
  swaggerDocs(app, PORT);
})