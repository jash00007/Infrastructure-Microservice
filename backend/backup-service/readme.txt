Made by Jash S B
#MySQL Backup Service

A Node.js-based service that generates MySQL database backups and uploads them to a specified cloud storage endpoint.

---

#Features

- Exports a MySQL database using `mysqldump`
- Temporarily stores and reads the SQL dump file
- Uploads the backup to a remote cloud storage API
- Cleans up local dump file after upload
- RESTful endpoint to trigger the process

---

#Tech Stack

- **Node.js**
- **Express**
- **Axios**
- **MySQL (mysqldump CLI)**
- **FormData API**
- **dotenv** for environment config

---

