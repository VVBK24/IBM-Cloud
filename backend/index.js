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
app.use(express.urlencoded({ extended: true }));

// History tracking
const fileHistory = [];

// IBM Cloud Object Storage configuration //API keys

const cos = new AWS.S3({
  endpoint: process.env.COS_ENDPOINT,
  apiKeyId: process.env.COS_API_KEY_ID,
  ibmAuthEndpoint: process.env.COS_AUTH_ENDPOINT,
  serviceInstanceId: process.env.COS_SERVICE_INSTANCE_ID,
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
    
    // Record upload in history
    fileHistory.push({
      id: Date.now(), // Add unique ID for each history item
      operation: 'upload',
      filename: file.originalname,
      timestamp: new Date().toISOString(),
      size: file.size
    });
    
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
    
    // Record deletion in history
    fileHistory.push({
      id: Date.now(), // Add unique ID for each history item
      operation: 'delete',
      filename: filename,
      timestamp: new Date().toISOString()
    });
    
    res.status(200).send('File deleted successfully!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting file.');
  }
});

// Get file history
app.get('/history', (req, res) => {
  try {
    res.json(fileHistory);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving history.');
  }
});

// Delete history items
app.post('/delete-history', (req, res) => {
   //console.log('Delete history endpoint hit');
   //console.log('Request body:', req.body);
  
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids)) {
      console.log('Invalid request body:', req.body);
      return res.status(400).json({ error: 'Invalid request: ids must be an array' });
    }

    //console.log('Deleting history items with ids:', ids);
    
    // Filter out the items to be deleted
    const newHistory = fileHistory.filter(item => !ids.includes(item.id));
    
    // Update the history array
    fileHistory.length = 0;
    fileHistory.push(...newHistory);

    //console.log('History updated, remaining items:', fileHistory.length);
    res.status(200).json({ 
      message: 'History items deleted successfully', 
      remainingCount: fileHistory.length 
    });
  } catch (error) {
    console.error('Error in delete history:', error);
    res.status(500).json({ error: 'Error deleting history items.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});