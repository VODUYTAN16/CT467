-- 0. Database
CREATE DATABASE IF NOT EXISTS gym_mgmt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gym_mgmt;

CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  role ENUM('admin','staff') DEFAULT 'staff',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Thêm tài khoản mẫu
INSERT INTO users (username, password, role) VALUES
('admin', '123456', 'admin'),
('nhanvien1', '123456', 'staff');


-- 1. Tables
CREATE TABLE packages (
  package_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  duration_months INT NOT NULL CHECK (duration_months > 0),
  price DECIMAL(12,2) NOT NULL CHECK (price >= 0),
  description VARCHAR(500),
  sessions_per_week TINYINT NOT NULL CHECK (sessions_per_week BETWEEN 1 AND 7),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_packages_name (name)
) ENGINE=InnoDB;

CREATE TABLE members (
  member_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  dob DATE,
  gender ENUM('Nam','Nữ','Khác') DEFAULT 'Khác',
  phone VARCHAR(20),
  address VARCHAR(255),
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_members_name (full_name),
  UNIQUE KEY uk_members_phone (phone)
) ENGINE=InnoDB;

CREATE TABLE subscriptions (
  subscription_id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  package_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('Đang hoạt động','Hết hạn') NOT NULL DEFAULT 'Đang hoạt động',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_sub_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
  CONSTRAINT fk_sub_package FOREIGN KEY (package_id) REFERENCES packages(package_id),
  KEY idx_sub_member (member_id),
  KEY idx_sub_end_date (end_date),
  KEY idx_sub_status (status)
) ENGINE=InnoDB;

CREATE TABLE equipment (
  equipment_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  type VARCHAR(80),
  status ENUM('Hoạt động','Bảo trì','Hỏng') NOT NULL DEFAULT 'Hoạt động',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_equipment_name (name),
  KEY idx_equipment_status (status)
) ENGINE=InnoDB;

CREATE TABLE equipment_usage (
  usage_id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  equipment_id INT NOT NULL,
  use_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INT AS (TIMESTAMPDIFF(MINUTE, CONCAT(use_date,' ',start_time), CONCAT(use_date,' ',end_time))) STORED,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_usage_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
  CONSTRAINT fk_usage_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id),
  KEY idx_usage_date (use_date),
  KEY idx_usage_equipment (equipment_id),
  KEY idx_usage_member (member_id),
  CHECK (end_time > start_time)
) ENGINE=InnoDB;

-- Thanh toán để phục vụ Trigger gia hạn
CREATE TABLE payments (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  subscription_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
  paid_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  note VARCHAR(255),
  CONSTRAINT fk_payment_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(subscription_id) ON DELETE CASCADE,
  KEY idx_payment_subscription (subscription_id),
  KEY idx_payment_paid_at (paid_at)
) ENGINE=InnoDB;

-- 2. Function: Kiểm tra hội viên có hết hạn trong 7 ngày (trả về 0/1)
DELIMITER $$
CREATE FUNCTION fn_is_member_expiring_7(memberId INT)
RETURNS TINYINT
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE lastEnd DATE;
  SELECT MAX(end_date) INTO lastEnd
  FROM subscriptions
  WHERE member_id = memberId;

  IF lastEnd IS NULL THEN
    RETURN 0; -- chưa có gói
  END IF;

  IF lastEnd BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN
    RETURN 1;
  ELSE
    RETURN 0;
  END IF;
END$$
DELIMITER ;

-- 3. Trigger: Tự động gia hạn gói tập khi thanh toán
-- Logic: Khi INSERT vào payments, lấy subscription và package tương ứng:
--   - Nếu end_date < CURDATE() => start mới = CURDATE(), end = CURDATE() + duration_months
--   - Ngược lại => cộng thêm duration_months từ end_date hiện tại
--   - Cập nhật status = 'Đang hoạt động'
DELIMITER $$
CREATE TRIGGER trg_extend_subscription_after_payment
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
  DECLARE pkg_months INT;
  DECLARE curr_end DATE;

  SELECT p.duration_months, s.end_date
    INTO pkg_months, curr_end
  FROM subscriptions s
  JOIN packages p ON p.package_id = s.package_id
  WHERE s.subscription_id = NEW.subscription_id
  FOR UPDATE;

  IF curr_end < CURDATE() THEN
    UPDATE subscriptions
       SET start_date = CURDATE(),
           end_date   = DATE_ADD(CURDATE(), INTERVAL pkg_months MONTH),
           status     = 'Đang hoạt động',
           updated_at = NOW()
     WHERE subscription_id = NEW.subscription_id;
  ELSE
    UPDATE subscriptions
       SET end_date   = DATE_ADD(curr_end, INTERVAL pkg_months MONTH),
           status     = 'Đang hoạt động',
           updated_at = NOW()
     WHERE subscription_id = NEW.subscription_id;
  END IF;
END$$
DELIMITER ;

-- 4. Stored Procedure: Danh sách hội viên sắp hết hạn (tham số ngày)
DELIMITER $$
CREATE PROCEDURE sp_members_expiring_soon(IN days_ahead INT)
BEGIN
  SELECT m.member_id, m.full_name, m.phone,
         s.subscription_id, s.end_date, s.status, p.name AS package_name
  FROM subscriptions s
  JOIN members m  ON m.member_id = s.member_id
  JOIN packages p ON p.package_id = s.package_id
  WHERE s.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL days_ahead DAY)
  ORDER BY s.end_date ASC, m.full_name;
END$$
DELIMITER ;

-- 5. Thống kê (ví dụ các truy vấn)
-- 5.1 Thiết bị được sử dụng nhiều nhất (top N)
-- Thay 10 bằng N mong muốn
SELECT eu.equipment_id, e.name, COUNT(*) AS usage_count
FROM equipment_usage eu
JOIN equipment e ON e.equipment_id = eu.equipment_id
GROUP BY eu.equipment_id, e.name
ORDER BY usage_count DESC
LIMIT 10;

-- 5.2 Doanh thu theo gói tập (theo tháng/năm, dựa vào payments và package của subscription)
-- Theo tháng hiện tại:
SELECT p.name AS package_name,
       DATE_FORMAT(pay.paid_at, '%Y-%m') AS ym,
       SUM(pay.amount) AS total_revenue
FROM payments pay
JOIN subscriptions s ON s.subscription_id = pay.subscription_id
JOIN packages p ON p.package_id = s.package_id
GROUP BY p.name, ym
ORDER BY ym DESC, total_revenue DESC;

-- 6. Seed dữ liệu tối thiểu (tùy ý)
-- INSERT INTO packages(name, duration_months, price, description, sessions_per_week)
-- VALUES
-- ('Cơ bản', 1, 500000, 'Gói 1 tháng', 3),
-- ('Nâng cao', 3, 1300000, 'Gói 3 tháng', 4),
-- ('VIP', 12, 4500000, 'Gói 12 tháng', 6);

-- INSERT INTO members(full_name, dob, gender, phone, address)
-- VALUES
-- ('Nguyễn Văn A','1995-05-12','Nam','0900000001','Hà Nội'),
-- ('Trần Thị B','1997-09-20','Nữ','0900000002','Đà Nẵng');

-- INSERT INTO equipment(name, type, status) VALUES
-- ('Treadmill LifeFitness', 'Cardio', 'Hoạt động'),
-- ('Dumbbell 10kg', 'Free weight', 'Hoạt động');

-- -- Hội viên A mua gói Cơ bản từ hôm nay
-- INSERT INTO subscriptions(member_id, package_id, start_date, end_date, status)
-- VALUES (1, 1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 MONTH), 'Đang hoạt động');

-- Payment để kích hoạt trigger gia hạn (ví dụ thanh toán gia hạn tiếp 1 tháng)
-- INSERT INTO payments(subscription_id, amount, note) VALUES (1, 500000, 'Gia hạn 1 tháng');
