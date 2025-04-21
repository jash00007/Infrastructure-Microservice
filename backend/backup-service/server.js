require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const app = express();
const port = 3006;
const cloudStorageBaseUrl = 'http://localhost:8000';
const adminUserId = 'admin';

app.use(cors());
app.use(express.json());

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
};

// Function to generate database dump
async function generateDatabaseDump() {
    const { DB_HOST, DB_USER, DB_PASS, DB_NAME } = process.env;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dumpFileName = `backup-${DB_NAME}-${timestamp}.sql`;
    const dumpFilePath = path.join(__dirname, dumpFileName);
    const command = `mysqldump -h ${DB_HOST} -u ${DB_USER} -p"${DB_PASS}" ${DB_NAME} > ${dumpFilePath}`;

    return new Promise((resolve, reject) => {
        exec(command, async (error, stdout, stderr) => {
            if (error) {
                console.error(`Error during database dump: ${error.message}`);
                reject({ message: 'Failed to create database dump', error: error.message });
                return;
            }
            // Check for errors *excluding* the password warning
            if (stderr && !stderr.includes('Using a password on the command line interface can be insecure.')) {
                console.error(`mysqldump stderr: ${stderr}`);
                reject({ message: 'Failed to create database dump', error: stderr });
                return;
            }

            try {
                const fileData = await fs.readFile(dumpFilePath, 'utf8');
                await fs.unlink(dumpFilePath);
                resolve({ data: fileData, filename: dumpFileName });
            } catch (readError) {
                console.error('Error reading dump file:', readError);
                reject({ message: 'Failed to read dump file', error: readError.message });
            }
        });
    });
}

// Route to trigger database dump and upload
app.get('/backup-and-upload-db', async (req, res) => {
    try {
        const dumpResult = await generateDatabaseDump();
        const { data, filename } = dumpResult;

        const formData = new FormData();
        formData.append("user_id", adminUserId);
        formData.append("file", new Blob([data]), filename);
        formData.append("path", filename); // Store with the filename in the root

        const uploadResponse = await axios.post(`${cloudStorageBaseUrl}/upload/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (uploadResponse.status === 200 && uploadResponse.data.status === 'success') {
            res.json({ message: 'Database backed up and uploaded successfully', uploadResult: uploadResponse.data });
        } else {
            console.error('Database upload failed:', uploadResponse.data);
            res.status(500).json({ message: 'Database backup successful, but upload failed', uploadError: uploadResponse.data });
        }

    } catch (error) {
        console.error('Error during backup and upload:', error);
        res.status(500).json({ message: 'Failed to backup and upload database', error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Backup server listening on port ${port}`);
});