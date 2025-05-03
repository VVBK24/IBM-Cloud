const express = require('express');
const multer = require('multer');
const AWS = require('ibm-cos-sdk');
const cors = require('cors');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());
app.use(express.json());

// IBM Cloud Object Storage configuration //API keys
const cos = new AWS.S3({
  ////API key and secret key
  endpoint: 'https://s3.us-south.cloud-object-storage.appdomain.cloud',
  apiKeyId: 'your_api_key', 
  ibmAuthEndpoint: 'https://iam.cloud.ibm.com/identity/token',
  serviceInstanceId: 'your_service_instance_id',
});

const Bucket = 'databackupandstoragesystem';

// Upload a file
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).send('No file uploaded.');
    }

    const params = {
      Bucket,
      Key: file.originalname,
      Body: file.buffer,
    };

    await cos.putObject(params).promise();
    res.status(200).send('File uploaded successfully!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error uploading file.');
  }
});

// Download a file
app.get('/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const params = {
      Bucket,
      Key: filename,
    };

    const data = await cos.getObject(params).promise();
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(data.Body);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error downloading file.');
  }
});

// List all files
app.get('/files', async (req, res) => {
  try {
    const params = {
      Bucket,
    };

    const data = await cos.listObjectsV2(params).promise();
    const files = data.Contents.map(item => item.Key);
    res.json(files);
  } catch (error) {
    console.error(error);
    res.status(500).send('Unable to list files');
  }
});

// Delete a file
app.delete('/delete/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const params = {
      Bucket,
      Key: filename,
    };

    await cos.deleteObject(params).promise();
    res.status(200).send('File deleted successfully!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting file.');
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});