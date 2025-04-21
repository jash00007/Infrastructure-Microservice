CREATE DATABASE INFRA_CC;
USE INFRA_CC

-- Table 1: Admins
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'admin') DEFAULT 'admin'
);

-- Table 2: Servers
CREATE TABLE servers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(50) NOT NULL,
    cpu_usage FLOAT DEFAULT 0,
    memory_usage FLOAT DEFAULT 0,
    disk_usage FLOAT DEFAULT 0,
    last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table 3: Labs
CREATE TABLE labs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    status ENUM('active', 'inactive', 'deleted') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_server INT,
    FOREIGN KEY (assigned_server) REFERENCES servers(id) ON DELETE SET NULL
);

-- Table 4: Logs
CREATE TABLE logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT,
    action TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);

-- Table 5: Reports (optional)
CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- performance, usage, etc.
    file_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

– Table 6: server_stats
CREATE TABLE server_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    server_id INT NOT NULL,
    cpu_usage FLOAT DEFAULT 0,
    memory_usage FLOAT DEFAULT 0,
    disk_usage FLOAT DEFAULT 0,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
);




–sample data
-- Add Admins
INSERT INTO admins (name, email, password, role)
VALUES 
('Alice Admin', 'alice@labs.com', 'hashedpassword123', 'super_admin'),
('Bob Manager', 'bob@labs.com', 'hashedpassword456', 'admin');

-- Add Servers
INSERT INTO servers (ip_address, cpu_usage, memory_usage, disk_usage)
VALUES 
('192.168.0.101', 15.5, 48.2, 72.9),
('192.168.0.102', 23.7, 55.1, 80.3);

-- Add Labs
INSERT INTO labs (name, status, assigned_server)
VALUES 
('DSA Lab', 'active', 1),
('OS Lab', 'inactive', 2),
('SE Lab', 'active', 1);

-- Add Logs
INSERT INTO logs (admin_id, action)
VALUES 
(1, 'Created new lab: DSA Lab'),
(2, 'Deactivated lab: OS Lab');

-- Add Server Stats (time-series entries)
INSERT INTO server_stats (server_id, cpu_usage, memory_usage, disk_usage, recorded_at)
VALUES
(1, 12.3, 45.0, 70.5, NOW() - INTERVAL 10 MINUTE),
(1, 18.1, 50.2, 73.1, NOW() - INTERVAL 5 MINUTE),
(1, 21.4, 55.9, 75.0, NOW()),
(2, 25.3, 60.0, 80.4, NOW() - INTERVAL 10 MINUTE),
(2, 27.8, 65.1, 82.3, NOW());

CREATE TABLE lab_server (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lab_id INT NOT NULL,
  server_id INT NOT NULL,
  FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE CASCADE,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
);

INSERT INTO lab_server (lab_id, server_id) VALUES 
(1, 1),
(2, 2),
(3, 1);

DROP TABLE server_stats;

– Table 6: server_stats
CREATE TABLE server_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    server_id INT NOT NULL,
    cpu_usage FLOAT DEFAULT 0,
    memory_usage FLOAT DEFAULT 0,
    disk_usage FLOAT DEFAULT 0,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
);

ALTER TABLE labs DROP FOREIGN KEY labs_ibfk_1;

ALTER TABLE labs DROP COLUMN assigned_server;

CREATE TABLE lab_access_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lab_id INT,
  user_count INT,
  duration_minutes INT, -- how long the users used the lab
  accessed_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (lab_id) REFERENCES labs(id)
);

ALTER TABLE servers
ADD COLUMN max_cpu FLOAT DEFAULT 100,
ADD COLUMN max_memory FLOAT DEFAULT 100,
ADD COLUMN max_disk FLOAT DEFAULT 100;

ALTER TABLE labs
ADD COLUMN estimated_users INT DEFAULT 10,
ADD COLUMN estimated_cpu FLOAT DEFAULT 10,
ADD COLUMN estimated_memory FLOAT DEFAULT 20,
ADD COLUMN estimated_disk FLOAT DEFAULT 5;

ALTER TABLE labs
ADD COLUMN estimated_users INT DEFAULT 10,
ADD COLUMN estimated_cpu FLOAT DEFAULT 10,
ADD COLUMN estimated_memory FLOAT DEFAULT 20,
ADD COLUMN estimated_disk FLOAT DEFAULT 5;

ALTER TABLE labs ADD COLUMN avg_users FLOAT DEFAULT NULL;
ALTER TABLE labs ADD COLUMN total_sessions INT DEFAULT 0;
ALTER TABLE labs ADD COLUMN total_user_minutes INT DEFAULT 0;

ALTER TABLE labs ADD COLUMN avg_time FLOAT;

ALTER TABLE lab_server
ADD COLUMN cpu_allocated INT DEFAULT 0,
ADD COLUMN memory_allocated INT DEFAULT 0,
ADD COLUMN disk_allocated INT DEFAULT 0;

-- Drop the existing foreign key
ALTER TABLE lab_access_log
DROP FOREIGN KEY lab_access_log_ibfk_1;

-- Re-add it without cascading delete
ALTER TABLE lab_access_log
ADD CONSTRAINT lab_access_log_ibfk_1
FOREIGN KEY (lab_id)
REFERENCES labs(id)
ON DELETE NO ACTION
ON UPDATE NO ACTION;

ALTER TABLE lab_access_log
ADD COLUMN is_active tinyint(1) default 1;

ALTER TABLE lab_access_log
DROP FOREIGN KEY lab_access_log_ibfk_1;

alter table logs drop foreign key logs_ibfk_1;
alter table logs drop column admin_id;





