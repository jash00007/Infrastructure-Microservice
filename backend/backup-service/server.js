require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

// Debug environment variables
console.log('Environment Variables:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('CLOUD_STORAGE_URL:', process.env.CLOUD_STORAGE_URL);

const app = express();
const port = 3006;
const cloudStorageBaseUrl = process.env.CLOUD_STORAGE_URL || 'http://localhost:8000';
const adminUserId = 'admin';

console.log('Server Configuration:');
console.log('Port:', port);
console.log('Cloud Storage Base URL:', cloudStorageBaseUrl);

app.use(cors());
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Request Headers:', req.headers);
    console.log('Request Body:', req.body);
    next();
});

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
};

// Function to generate database dump
async function generateDatabaseDump() {
    console.log('Starting database dump generation...');
    const { DB_HOST, DB_USER, DB_PASS, DB_NAME } = process.env;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dumpFileName = `backup-${DB_NAME}-${timestamp}.sql`;
    const dumpFilePath = path.join(__dirname, dumpFileName);
    
    console.log('Dump file details:');
    console.log('- Filename:', dumpFileName);
    console.log('- Full path:', dumpFilePath);
    
    const command = `mysqldump -h ${DB_HOST} -u ${DB_USER} -p"${DB_PASS}" ${DB_NAME} > ${dumpFilePath}`;
    console.log('Executing mysqldump command...');

    return new Promise((resolve, reject) => {
        exec(command, async (error, stdout, stderr) => {
            if (error) {
                console.error('mysqldump execution error:', error);
                console.error('Error stack:', error.stack);
                reject({ message: 'Failed to create database dump', error: error.message });
                return;
            }
            
            if (stderr) {
                console.log('mysqldump stderr output:', stderr);
                if (!stderr.includes('Using a password on the command line interface can be insecure.')) {
                    reject({ message: 'Failed to create database dump', error: stderr });
                    return;
                }
            }

            try {
                console.log('Reading dump file...');
                const fileData = await fs.readFile(dumpFilePath, 'utf8');
                console.log(`Dump file size: ${fileData.length} bytes`);
                
                console.log('Deleting temporary dump file...');
                await fs.unlink(dumpFilePath);
                console.log('Temporary file deleted successfully');
                
                resolve({ data: fileData, filename: dumpFileName });
            } catch (readError) {
                console.error('Error handling dump file:', readError);
                console.error('Error stack:', readError.stack);
                reject({ message: 'Failed to read dump file', error: readError.message });
            }
        });
    });
}

// Route to trigger database dump and upload
app.get('/backup-and-upload-db', async (req, res) => {
    console.log('\n=== Starting backup and upload process ===');
    console.log('Time:', new Date().toISOString());
    
    try {
        console.log('Generating database dump...');
        const dumpResult = await generateDatabaseDump();
        console.log('Database dump generated successfully');
        console.log('Dump filename:', dumpResult.filename);

        const { data, filename } = dumpResult;

        console.log('Preparing form data for upload...');
        const formData = new FormData();
        formData.append("user_id", adminUserId);
        formData.append("file", new Blob([data]), filename);
        formData.append("path", filename);

        console.log('Uploading to cloud storage...');
        console.log('Upload URL:', `${cloudStorageBaseUrl}/upload/`);
        
        const uploadResponse = await axios.post(`${cloudStorageBaseUrl}/upload/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        console.log('Upload response received:');
        console.log('Status:', uploadResponse.status);
        console.log('Response data:', uploadResponse.data);

        if (uploadResponse.status === 200 && uploadResponse.data.status === 'success') {
            console.log('Backup and upload completed successfully');
            res.json({ message: 'Database backed up and uploaded successfully', uploadResult: uploadResponse.data });
        } else {
            console.error('Upload failed with response:', uploadResponse.data);
            res.status(500).json({ message: 'Database backup successful, but upload failed', uploadError: uploadResponse.data });
        }

    } catch (error) {
        console.error('Error during backup and upload process:');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: 'Failed to backup and upload database', error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler caught an error:');
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ message: 'Internal server error', error: err.message });
});

app.listen(port, () => {
    console.log(`\n=== Backup Server Started ===`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`Server listening on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Process ID: ${process.pid}`);
    console.log(`Working Directory: ${process.cwd()}`);
    console.log('=========================\n');
});