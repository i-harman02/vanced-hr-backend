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
const fileUpload = require('express-fileupload');

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


app.use(fileUpload());

app.post('/api/testing', async (req, res) => {
  try {
    // Check if req.file is populated
    if (!req.files || Object.keys(req.files).length === 0) {
      throw new Error('No files were uploaded.');
    }

    const image = req.files.image; // Make sure 'image' matches the name attribute in your HTML form

    if (!image.data) {
      throw new Error('File data is missing hhhhhhhhhhhhhhhh. ');
    }




    // // Ensure that the 'data' property exists
    // if (!image || !image.data) {
    //   throw new Error('File data is missing. ' + JSON.stringify(req.files));
    // }


    // // Process and handle the file here
    // const { data, name } = image;
    // const { url } = await put(`home/${name}`, data, options);
    
    // console.log('Upload successful:', url);
    res.send("Working 0.2");
  } catch (error) {
    console.error('Error during file upload:', error);
    res.status(500).send('Internal Server Error');
  }
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