DROP DATABASE IF EXISTS gym_mgmt;
CREATE DATABASE gym_mgmt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gym_mgmt;

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

DELIMITER $$

CREATE TRIGGER trg_packages_prevent_delete_if_in_use
BEFORE DELETE ON packages
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1
        FROM subscriptions
        WHERE package_id = OLD.package_id
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể xóa gói tập vì đã có hội viên đăng ký.';
    END IF;
END$$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER trg_packages_prevent_update_if_in_use
BEFORE UPDATE ON packages
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1
        FROM subscriptions
        WHERE package_id = OLD.package_id
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể chỉnh sửa gói tập vì đã có hội viên đăng ký.';
    END IF;
END$$

DELIMITER ;


CREATE TABLE members (
  member_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  dob DATE,
  gender ENUM('Nam','Nữ','Khác') DEFAULT 'Khác',
  phone VARCHAR(20) CHECK (phone REGEXP '^0[0-9]{9}$'),
  address VARCHAR(255),
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_members_name (full_name),
  UNIQUE KEY uk_members_phone (phone)
) ENGINE=InnoDB;

DELIMITER $$
CREATE TRIGGER trg_members_dob_check_update
BEFORE UPDATE ON members
FOR EACH ROW
BEGIN
    IF NEW.dob IS NOT NULL AND NEW.dob > CURRENT_DATE() THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Ngày sinh (dob) không được lớn hơn ngày hiện tại.';
    END IF;
END $$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER trg_members_dob_check_insert
BEFORE INSERT ON members
FOR EACH ROW
BEGIN
    IF NEW.dob IS NOT NULL AND NEW.dob > CURRENT_DATE() THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Ngày sinh không được lớn hơn ngày hiện tại.';
    END IF;
END $$
DELIMITER ;


CREATE TABLE subscriptions (
  subscription_id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  package_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('Đang hoạt động','Hết hạn') NOT NULL DEFAULT 'Đang hoạt động',
  paid BOOLEAN DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (start_date < end_date),
  CONSTRAINT fk_sub_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
  CONSTRAINT fk_sub_package FOREIGN KEY (package_id) REFERENCES packages(package_id),
  KEY idx_sub_member (member_id),
  KEY idx_sub_end_date (end_date),
  KEY idx_sub_status (status)
) ENGINE=InnoDB;

DELIMITER $$
CREATE TRIGGER trg_subscriptions_prevent_duplicate
BEFORE INSERT ON subscriptions
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1
        FROM subscriptions
        WHERE member_id = NEW.member_id
          AND package_id = NEW.package_id
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Người dùng đã đăng ký rồi, đóng tiền để gia hạn.';
    END IF;
END$$
DELIMITER ;

DELIMITER $$

-- 1) Ngăn xóa subscription nếu đã có payment
CREATE TRIGGER trg_subscriptions_prevent_delete_if_paid
BEFORE DELETE ON subscriptions
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1
        FROM payments
        WHERE subscription_id = OLD.subscription_id
        LIMIT 1
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể xóa subscription đã có thanh toán.';
    END IF;
END$$
DELIMITER ;


-- DELIMITER $$

-- CREATE TRIGGER trg_subscriptions_prevent_duplicate_and_startdate
-- BEFORE INSERT ON subscriptions
-- FOR EACH ROW
-- BEGIN
--     -- Kiểm tra trùng đăng ký
--     IF EXISTS (
--         SELECT 1
--         FROM subscriptions
--         WHERE member_id = NEW.member_id
--           AND package_id = NEW.package_id
--     ) THEN
--         SIGNAL SQLSTATE '45000'
--             SET MESSAGE_TEXT = 'Người dùng đã đăng ký rồi, đóng tiền để gia hạn.';
--     END IF;

--     -- Kiểm tra start_date >= ngày hiện tại
--     IF NEW.start_date < CURDATE() THEN
--         SIGNAL SQLSTATE '45000'
--             SET MESSAGE_TEXT = 'Ngày bắt đầu phải lớn hơn hoặc bằng ngày hiện tại.';
--     END IF;
-- END$$

-- DELIMITER ;


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

DELIMITER $$

CREATE TRIGGER trg_equipment_prevent_delete_if_in_use
BEFORE DELETE ON equipment
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1
        FROM equipment_usage
        WHERE equipment_id = OLD.equipment_id
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể xóa thiết bị vì đã có lịch sử sử dụng.';
    END IF;
END$$

DELIMITER ;


DELIMITER $$

CREATE TRIGGER trg_equipment_prevent_update_if_in_use
BEFORE UPDATE ON equipment
FOR EACH ROW
BEGIN
    -- Nếu thiết bị đã từng được sử dụng
    IF EXISTS (
        SELECT 1
        FROM equipment_usage
        WHERE equipment_id = OLD.equipment_id
    ) THEN

        -- Cho phép đổi STATUS, nhưng không cho sửa các trường khác
        IF NEW.name <> OLD.name
           OR NEW.type <> OLD.type
           OR NEW.equipment_id <> OLD.equipment_id THEN

            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Không thể chỉnh sửa thông tin thiết bị ngoại trừ trạng thái (status) vì đã có lịch sử sử dụng.';
        END IF;

    END IF;
END$$

DELIMITER ;



CREATE TABLE equipment_usage (
  usage_id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  equipment_id INT NOT NULL,
  use_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  duration_minutes INT AS (
    TIMESTAMPDIFF(
      MINUTE,
      TIMESTAMP(use_date, start_time),
      TIMESTAMP(use_date, end_time)
    )
) STORED,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (end_time > start_time),
  CHECK (duration_minutes >= 1),
  CHECK (duration_minutes IS NULL OR duration_minutes >= 0),
  CONSTRAINT fk_usage_member
      FOREIGN KEY (member_id)
      REFERENCES members(member_id)
      ON DELETE CASCADE,

  CONSTRAINT fk_usage_equipment
      FOREIGN KEY (equipment_id)
      REFERENCES equipment(equipment_id),

  KEY idx_usage_date (use_date),
  KEY idx_usage_equipment (equipment_id),
  KEY idx_usage_member (member_id)
) ENGINE=InnoDB;

DELIMITER $$
CREATE TRIGGER trg_equipment_usage_no_overlap_update
BEFORE UPDATE ON equipment_usage
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1
        FROM equipment_usage
        WHERE equipment_id = NEW.equipment_id
          AND use_date = NEW.use_date
          AND usage_id <> OLD.usage_id
          AND (
                (NEW.start_time < end_time AND NEW.end_time > start_time)
              )
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Thời gian sử dụng thiết bị bị trùng.';
    END IF;
END $$
DELIMITER ;

DELIMITER $$

DROP TRIGGER IF EXISTS trg_equipment_usage_no_overlap_insert$$

CREATE TRIGGER trg_equipment_usage_no_overlap_insert
BEFORE INSERT ON equipment_usage
FOR EACH ROW
BEGIN
    -- 1) Kiểm tra tình trạng thiết bị
    IF EXISTS (
        SELECT 1
        FROM equipment
        WHERE equipment_id = NEW.equipment_id
          AND status IN ('Bảo trì', 'Hỏng')
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Thiết bị đang không có sẵn.';
    END IF;

    -- 2) Kiểm tra trùng giờ sử dụng
    IF EXISTS (
        SELECT 1
        FROM equipment_usage
        WHERE equipment_id = NEW.equipment_id
          AND use_date = NEW.use_date
          AND (NEW.start_time < end_time AND NEW.end_time > start_time)
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Thời gian sử dụng thiết bị bị trùng.';
    END IF;
END$$

DELIMITER ;


DELIMITER $$
CREATE TRIGGER chk_use_date_before_insert
BEFORE INSERT ON equipment_usage
FOR EACH ROW
BEGIN
    IF NEW.use_date > CURRENT_DATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'ngày sử dụng không thể lớn hơn ngày hiện tại';
    END IF;
END$$

CREATE TRIGGER chk_use_date_before_update
BEFORE UPDATE ON equipment_usage
FOR EACH ROW
BEGIN
    IF NEW.use_date > CURRENT_DATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'ngày sử dụng không thể lớn hơn ngày hiện tại';
    END IF;
END$$
DELIMITER ;


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

DROP TRIGGER IF EXISTS trg_extend_subscription_after_payment$$

CREATE TRIGGER trg_extend_subscription_after_payment
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
  DECLARE pkg_months INT;
  DECLARE curr_end DATE;
  DECLARE pay_count INT;

  -- 1) Kiểm tra xem subscription này đã từng thanh toán chưa
  SELECT COUNT(*) INTO pay_count
  FROM payments
  WHERE subscription_id = NEW.subscription_id
    AND payment_id <> NEW.payment_id;  -- tránh đếm chính payment vừa insert

  -- 2) Luôn cập nhật paid = 1 cho subscription
  UPDATE subscriptions
     SET paid = 1,
         updated_at = NOW()
   WHERE subscription_id = NEW.subscription_id;

  -- 3) Chỉ gia hạn nếu đã có thanh toán trước đó
  IF pay_count > 0 THEN

    -- Lấy số tháng của gói & end_date hiện tại
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

----------------------------------------------------------
-- 1) PACKAGES — Gói tập phong cách Cần Thơ (giá bình dân)
----------------------------------------------------------
INSERT INTO packages (name, duration_months, price, description, sessions_per_week)
VALUES
('Gói Cơ bản Ninh Kiều 1 tháng', 1, 400000, 'Gói tập cơ bản phù hợp người mới bắt đầu', 3),
('Gói Tăng cơ Cái Răng 3 tháng', 3, 950000, 'Tăng cơ – giảm mỡ trong 3 tháng', 4),
('Gói Yoga Bến Ninh Kiều', 1, 650000, 'Lớp Yoga buổi sáng và chiều', 3),
('Gói Cardio Sông Hậu 1 tháng', 1, 380000, 'Cardio cơ bản giúp cải thiện sức bền', 3),
('Gói Gym Bình Thuỷ 6 tháng', 6, 1600000, 'Gói luyện tập dài hạn 6 tháng', 5),
('Gói PT Cá nhân Tây Đô 2 tháng', 2, 1500000, 'Huấn luyện viên cá nhân 1 kèm 1', 3);


----------------------------------------------------------
-- 2) MEMBERS — 15 hội viên Cần Thơ
----------------------------------------------------------
INSERT INTO members (full_name, dob, gender, phone, address)
VALUES
('Nguyễn Hoài Phong', '1994-05-11', 'Nam', '0901001001', 'Ninh Kiều, Cần Thơ'),
('Võ Yến My', '1998-02-20', 'Nữ', '0901001002', 'Cái Răng, Cần Thơ'),
('Huỳnh Minh Tính', '1992-07-14', 'Nam', '0901001003', 'Bình Thuỷ, Cần Thơ'),
('Trần Mỹ Hạnh', '1995-09-09', 'Nữ', '0901001004', 'Ninh Kiều, Cần Thơ'),
('Nguyễn Quốc Thịnh', '1989-03-22', 'Nam', '0901001005', 'Ô Môn, Cần Thơ'),
('Lê Thuý An', '1996-11-01', 'Nữ', '0901001006', 'Phong Điền, Cần Thơ'),
('Phạm Hoài Nhân', '1991-01-19', 'Nam', '0901001007', 'Cái Răng, Cần Thơ'),
('Võ Ngọc Trân', '1999-06-04', 'Nữ', '0901001008', 'Ninh Kiều, Cần Thơ'),
('Đoàn Hải Nam', '1993-10-15', 'Nam', '0901001009', 'Thốt Nốt, Cần Thơ'),
('Ngô Thái Nhi', '1997-12-29', 'Nữ', '0901001010', 'Bình Thuỷ, Cần Thơ'),
('Lâm Chí Dũng', '1988-04-17', 'Nam', '0901001011', 'Cái Răng, Cần Thơ'),
('Trần Gia Huy', '2000-03-09', 'Nam', '0901001012', 'Ninh Kiều, Cần Thơ'),
('Hà Phương Anh', '1999-08-30', 'Nữ', '0901001013', 'Phong Điền, Cần Thơ'),
('Nguyễn Thanh Tâm', '1995-01-25', 'Nam', '0901001014', 'Cái Răng, Cần Thơ'),
('Bùi Mỹ Duyên', '1998-07-07', 'Nữ', '0901001015', 'Ninh Kiều, Cần Thơ');


----------------------------------------------------------
-- 3) EQUIPMENT — 10 thiết bị mới hoàn toàn
----------------------------------------------------------
INSERT INTO equipment (name, type, status)
VALUES
('Máy chạy bộ MOFIT MHT-2420', 'Cardio', 'Hoạt động'),
('Xe đạp tập AirBike MK-290', 'Cardio', 'Hoạt động'),
('Dàn tạ đa năng HQ-908', 'Strength', 'Hoạt động'),
('Ghế tập bụng Kingsport', 'Strength', 'Hoạt động'),
('Tạ đơn 5kg', 'Free weight', 'Hoạt động'),
('Tạ đơn 10kg', 'Free weight', 'Hoạt động'),
('Tạ đơn 15kg', 'Free weight', 'Hoạt động'),
('Thảm Yoga Relax CT', 'Yoga', 'Hoạt động'),
('Máy kéo xô HQ-918', 'Strength', 'Hoạt động'),
('Xà đơn treo tường CT', 'Bodyweight', 'Hoạt động');


----------------------------------------------------------
-- 4) SUBSCRIPTIONS — 15 gói đăng ký (đời thực)
----------------------------------------------------------
INSERT INTO subscriptions (member_id, package_id, start_date, end_date, status, paid)
VALUES
(1, 1, '2025-09-05', '2025-10-04', 'Hết hạn', 1),
(2, 2, '2025-09-10', '2025-12-09', 'Đang hoạt động', 1),
(3, 4, '2025-10-01', '2025-10-31', 'Hết hạn', 1),
(4, 3, '2025-11-01', '2025-11-30', 'Đang hoạt động', 0),
(5, 5, '2025-09-15', '2026-03-14', 'Đang hoạt động', 1),
(6, 1, '2025-11-10', '2025-12-09', 'Đang hoạt động', 0),
(7, 2, '2025-10-20', '2026-01-19', 'Đang hoạt động', 1),
(8, 3, '2025-10-25', '2025-11-24', 'Đang hoạt động', 1),
(9, 4, '2025-11-05', '2025-12-04', 'Đang hoạt động', 0),
(10, 6, '2025-09-01', '2025-10-31', 'Hết hạn', 1),
(11, 1, '2025-09-18', '2025-10-17', 'Hết hạn', 1),
(12, 2, '2025-10-02', '2026-01-01', 'Đang hoạt động', 0),
(13, 3, '2025-11-10', '2025-12-09', 'Đang hoạt động', 0),
(14, 5, '2025-09-28', '2026-03-27', 'Đang hoạt động', 1),
(15, 6, '2025-10-15', '2025-12-14', 'Đang hoạt động', 1);


----------------------------------------------------------
-- 5) PAYMENTS — 15 giao dịch thanh toán (đúng logic paid=1)
----------------------------------------------------------
INSERT INTO payments (subscription_id, amount, paid_at, note)
VALUES
(1, 400000, '2025-09-05 08:15:00', 'Thanh toán gói cơ bản 1 tháng'),
(2, 950000, '2025-09-10 17:50:00', 'Thanh toán gói tăng cơ 3 tháng'),
(3, 380000, '2025-10-01 07:10:00', 'Thanh toán gói Cardio'),
(5, 1600000, '2025-09-15 18:00:00', 'Thanh toán gói 6 tháng'),
(7, 950000, '2025-10-20 18:25:00', 'Thanh toán gói tăng cơ 3 tháng'),
(8, 650000, '2025-10-25 06:55:00', 'Yoga 1 tháng'),
(10, 1500000, '2025-09-01 07:40:00', 'PT cá nhân 2 tháng'),
(11, 400000, '2025-09-18 18:35:00', 'Gói cơ bản'),
(14, 1600000, '2025-09-28 19:00:00', 'Gói 6 tháng'),
(15, 1500000, '2025-10-15 17:20:00', 'Gói PT cá nhân'),
(4, 650000, '2025-11-01 07:50:00', 'Đóng Yoga tháng 11'),
(6, 400000, '2025-11-10 06:30:00', 'Thanh toán chậm 3 ngày'),
(9, 380000, '2025-11-05 19:10:00', 'Đóng gói Cardio'),
(12, 950000, '2025-10-02 20:00:00', 'Thanh toán gói 3 tháng'),
(13, 650000, '2025-11-10 06:10:00', 'Yoga Bến Ninh Kiều');


----------------------------------------------------------
-- 6) EQUIPMENT USAGE — 15 lượt sử dụng (đời thực, không trùng giờ)
----------------------------------------------------------
INSERT INTO equipment_usage (member_id, equipment_id, use_date, start_time, end_time)
VALUES
(1, 1, '2025-09-07', '06:10:00', '06:55:00'),
(2, 8, '2025-09-10', '17:30:00', '18:10:00'),
(3, 2, '2025-10-03', '18:00:00', '18:45:00'),
(4, 7, '2025-11-02', '05:40:00', '06:20:00'),
(5, 3, '2025-09-16', '19:00:00', '19:50:00'),
(6, 4, '2025-11-11', '20:00:00', '20:40:00'),
(7, 9, '2025-10-21', '06:00:00', '06:40:00'),
(8, 1, '2025-10-26', '17:10:00', '17:55:00'),
(9, 5, '2025-11-06', '18:20:00', '19:00:00'),
(10, 6, '2025-09-03', '06:25:00', '07:00:00'),
(11, 2, '2025-09-19', '19:15:00', '19:55:00'),
(12, 8, '2025-10-04', '20:05:00', '20:50:00'),
(13, 3, '2025-11-12', '05:55:00', '06:35:00'),
(14, 4, '2025-09-29', '17:45:00', '18:25:00'),
(15, 9, '2025-10-16', '18:10:00', '18:55:00');

----------------------------------------------------------
-- MEMBERS MỚI (sẽ có gói sắp hết hạn)
----------------------------------------------------------
INSERT INTO members (full_name, dob, gender, phone, address)
VALUES
('Trần Nhật Khánh', '1996-03-12', 'Nam', '0901001016', 'Ninh Kiều, Cần Thơ'),
('Võ Bảo Ngân', '1999-09-01', 'Nữ', '0901001017', 'Cái Răng, Cần Thơ'),
('Nguyễn Hữu Đạt', '1991-12-22', 'Nam', '0901001018', 'Bình Thuỷ, Cần Thơ'),
('Phạm Gia Linh', '1998-07-30', 'Nữ', '0901001019', 'Ô Môn, Cần Thơ'),
('Đặng Minh Triết', '1993-04-05', 'Nam', '0901001020', 'Phong Điền, Cần Thơ');


----------------------------------------------------------
-- SUBSCRIPTIONS MỚI – TẤT CẢ ĐỀU SẮP HẾT HẠN (19–25/11/2025)
----------------------------------------------------------
-- member_id bắt đầu từ 16 → theo đúng thứ tự insert
INSERT INTO subscriptions (member_id, package_id, start_date, end_date, status, paid)
VALUES
(16, 1, '2025-10-20', '2025-11-19', 'Đang hoạt động', 1),   -- hết hạn sau 1 ngày
(17, 3, '2025-10-26', '2025-11-24', 'Đang hoạt động', 1),   -- còn 6 ngày
(18, 4, '2025-10-28', '2025-11-25', 'Đang hoạt động', 0),   -- chưa đóng tiền
(19, 2, '2025-08-25', '2025-11-22', 'Đang hoạt động', 1),   -- còn 4 ngày
(20, 1, '2025-10-21', '2025-11-21', 'Đang hoạt động', 0);   -- chưa đóng tiền

