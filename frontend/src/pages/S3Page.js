import React, { useState } from 'react';
import config from '../config';

const BackupDatabase = () => {
  const [backupStatus, setBackupStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleBackupAndUpload = async () => {
    setBackupStatus('Initiating backup...');
    setErrorMessage('');

    try {
      const response = await fetch(`${config.BACKUP_URL}/backup-and-upload-db`);
      const data = await response.json();

      if (response.ok) {
        setBackupStatus(data.message);
      } else {
        setErrorMessage(data.message || 'Backup and upload failed');
        setBackupStatus('Backup failed');
      }
      console.log('Backup Response:', data);
    } catch (error) {
      console.error('Error calling backup endpoint:', error);
      setErrorMessage('Failed to connect to backup server');
      setBackupStatus('Backup failed');
    }
  };

  return (
    <div>
      <h2>Database Backup</h2>
      <button onClick={handleBackupAndUpload}>Backup and Upload Database to Cloud</button>
      {backupStatus && <p>Status: {backupStatus}</p>}
      {errorMessage && <p style={{ color: 'red' }}>Error: {errorMessage}</p>}
    </div>
  );
};

export default BackupDatabase;