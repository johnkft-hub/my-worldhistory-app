-- MariaDB 접속 (비밀번호 입력 필요)
mysql -u root -p

-- 1. 데이터베이스 생성
CREATE DATABASE history_db;

-- 2. 해당 데이터베이스 선택
USE history_db;

-- 3. 사건 저장용 테이블 생성
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    year INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    region VARCHAR(50),
    description TEXT,
    importance INT DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);