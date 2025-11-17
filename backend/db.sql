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


--------------------------------------------------
-- 1. Gói tập (packages)
--------------------------------------------------
INSERT INTO packages (name, duration_months, price, description, sessions_per_week)
VALUES
('Gói Cơ bản 1 tháng', 1, 500000, 'Gói tập cơ bản 1 tháng, phù hợp người mới bắt đầu', 3),
('Gói Tiêu chuẩn 3 tháng', 3, 1300000, 'Gói 3 tháng, tập đều đặn cải thiện sức khỏe', 4),
('Gói Nâng cao 6 tháng', 6, 2400000, 'Gói 6 tháng cho hội viên tập trung tăng cơ/giảm mỡ', 5),
('Gói VIP 12 tháng', 12, 4500000, 'Gói 12 tháng, ưu tiên sử dụng thiết bị và PT hỗ trợ', 6),
('Gói Yoga 1 tháng', 1, 600000, 'Lớp Yoga nhóm 3 buổi/tuần', 3),
('Gói PT cá nhân 2 tháng', 2, 3500000, 'Gói huấn luyện viên cá nhân 12 buổi trong 2 tháng', 3);

--------------------------------------------------
-- 2. Hội viên (members)
--------------------------------------------------
INSERT INTO members (full_name, dob, gender, phone, address)
VALUES
('Nguyễn Văn An',   '1995-03-15', 'Nam', '0901000001', 'Quận 1, TP. Hồ Chí Minh'),
('Trần Thị Bích',   '1998-07-22', 'Nữ', '0901000002', 'Quận 3, TP. Hồ Chí Minh'),
('Lê Hoàng Minh',   '1990-11-02', 'Nam', '0901000003', 'Cầu Giấy, Hà Nội'),
('Phạm Thu Trang',  '1992-01-09', 'Nữ', '0901000004', 'Thanh Xuân, Hà Nội'),
('Đỗ Đức Long',     '1985-12-30', 'Nam', '0901000005', 'Hải Châu, Đà Nẵng'),
('Vũ Ngọc Mai',     '2000-05-18', 'Nữ', '0901000006', 'Quận 7, TP. Hồ Chí Minh'),
('Hoàng Gia Huy',   '1999-09-10', 'Nam', '0901000007', 'TP. Thủ Đức, TP. Hồ Chí Minh'),
('Bùi Thị Hằng',    '1988-02-27', 'Nữ', '0901000008', 'Bình Thạnh, TP. Hồ Chí Minh'),
('Phan Quốc Khánh', '1994-08-05', 'Nam', '0901000009', 'Nha Trang, Khánh Hòa'),
('Lương Mỹ Dung',   '1996-04-12', 'Nữ', '0901000010', 'Cần Thơ'),
('Tạ Thanh Tùng',   '1989-10-01', 'Nam', '0901000011', 'Vũng Tàu'),
('Nguyễn Thảo Ly',  '2001-12-19', 'Nữ', '0901000012', 'Huế');

-- Giả sử member_id hiện tại sẽ là 1..12 theo thứ tự trên

--------------------------------------------------
-- 3. Thiết bị (equipment)
--------------------------------------------------
INSERT INTO equipment (name, type, status)
VALUES
('Máy chạy bộ LifeFitness T5', 'Cardio',     'Hoạt động'),
('Xe đạp tập Technogym',       'Cardio',     'Hoạt động'),
('Dàn tạ đa năng Hoist',       'Strength',   'Hoạt động'),
('Tạ đơn 5kg',                 'Free weight','Hoạt động'),
('Tạ đơn 10kg',                'Free weight','Hoạt động'),
('Ghế tập bụng',               'Strength',   'Hoạt động'),
('Máy kéo xô',                 'Strength',   'Bảo trì'),
('Thảm Yoga Reebok',           'Yoga',       'Hoạt động'),
('Xà đơn treo tường',          'Bodyweight', 'Hoạt động'),
('Máy ép ngực',                'Strength',   'Hỏng');

-- Giả sử equipment_id sẽ là 1..10 theo thứ tự trên

--------------------------------------------------
-- 4. Gói đăng ký (subscriptions)
-- Hôm nay giả định là 2025-11-16
--------------------------------------------------
INSERT INTO subscriptions (member_id, package_id, start_date, end_date, status, paid)
VALUES
-- 1: An - Gói VIP 12 tháng, còn hạn dài
(1, 4, '2025-01-10', '2026-01-09', 'Đang hoạt động', 1),

-- 2: Bích - Gói 3 tháng, chuẩn bị hết hạn cuối tháng 11
(2, 2, '2025-09-01', '2025-11-30', 'Đang hoạt động', 1),

-- 3: Minh - Gói nâng cao 6 tháng, còn hạn tới giữa tháng 12
(3, 3, '2025-06-15', '2025-12-14', 'Đang hoạt động', 1),

-- 4: Trang - Gói cơ bản 1 tháng, sắp hết hạn trong 7 ngày (2025-11-19)
(4, 1, '2025-10-20', '2025-11-19', 'Đang hoạt động', 1),

-- 5: Long - Gói cơ bản 1 tháng, đã hết hạn từ tháng 8
(5, 1, '2025-08-01', '2025-08-31', 'Hết hạn', 1),

-- 6: Mai - Gói Yoga 1 tháng, mới tham gia, chưa thanh toán đủ (paid=0)
(6, 5, '2025-11-10', '2025-12-09', 'Đang hoạt động', 0),

-- 7: Huy - Gói tiêu chuẩn 3 tháng, đã hết hạn
(7, 2, '2025-07-01', '2025-09-30', 'Hết hạn', 1),

-- 8: Hằng - Gói nâng cao 6 tháng, đã hết hạn
(8, 3, '2025-04-01', '2025-09-30', 'Hết hạn', 1),

-- 9: Khánh - Gói Yoga 1 tháng, mới đăng ký, chưa thanh toán
(9, 5, '2025-11-15', '2025-12-14', 'Đang hoạt động', 0),

-- 10: Dung - Gói cơ bản 1 tháng, đang hoạt động
(10, 1, '2025-11-01', '2025-11-30', 'Đang hoạt động', 1),

-- 11: Tùng - Gói VIP 12 tháng, gần hết hạn (30/11/2025)
(11, 4, '2024-12-01', '2025-11-30', 'Đang hoạt động', 1),

-- 12: Thảo Ly - Gói tiêu chuẩn 3 tháng, còn hạn tới 04/01/2026, chưa trả đủ
(12, 2, '2025-10-05', '2026-01-04', 'Đang hoạt động', 0),

-- 13: An - thêm gói Yoga 1 tháng, mới bắt đầu hôm nay
(1, 5, '2025-11-16', '2025-12-15', 'Đang hoạt động', 0),

-- 14: Bích - thêm gói cơ bản 1 tháng, mới đăng ký
(2, 1, '2025-11-10', '2025-12-09', 'Đang hoạt động', 0),

-- 15: Minh - Gói PT cá nhân 2 tháng, vừa hết hạn 09/11/2025
(3, 6, '2025-09-10', '2025-11-09', 'Hết hạn', 1),

-- 16: Trang - Gói PT cá nhân 2 tháng, mới đăng ký, chưa thanh toán
(4, 6, '2025-11-12', '2026-01-11', 'Đang hoạt động', 0),

-- 17: Long - Gói tiêu chuẩn 3 tháng, vẫn còn hạn tới cuối năm
(5, 2, '2025-10-01', '2025-12-31', 'Đang hoạt động', 1),

-- 18: Khánh - Gói nâng cao 6 tháng đã hết hạn
(9, 3, '2025-03-01', '2025-08-31', 'Hết hạn', 1);

-- Giả sử subscription_id tạo ra lần lượt từ 1 đến 18

--------------------------------------------------
-- 5. Thanh toán (payments)
-- Tạo payment cho các subscription có paid = 1
--------------------------------------------------
INSERT INTO payments (subscription_id, amount, paid_at, note)
VALUES
-- sub 1 - An - Gói VIP
(1, 4500000, '2025-01-10 09:15:00', 'Thanh toán gói VIP 12 tháng'),

-- sub 2 - Bích - Gói tiêu chuẩn
(2, 1300000, '2025-09-01 08:30:00', 'Thanh toán gói 3 tháng'),

-- sub 3 - Minh - Gói nâng cao
(3, 2400000, '2025-06-15 18:45:00', 'Thanh toán gói 6 tháng'),

-- sub 4 - Trang - Gói cơ bản
(4, 500000, '2025-10-20 07:55:00', 'Thanh toán gói 1 tháng'),

-- sub 5 - Long - Gói cơ bản (đã hết hạn)
(5, 500000, '2025-08-01 10:05:00', 'Thanh toán gói 1 tháng'),

-- sub 7 - Huy - Gói tiêu chuẩn
(7, 1300000, '2025-07-01 19:10:00', 'Thanh toán gói 3 tháng'),

-- sub 8 - Hằng - Gói nâng cao
(8, 2400000, '2025-04-01 17:40:00', 'Thanh toán gói 6 tháng'),

-- sub 10 - Dung - Gói cơ bản
(10, 500000, '2025-11-01 06:55:00', 'Thanh toán gói 1 tháng'),

-- sub 11 - Tùng - Gói VIP
(11, 4500000, '2024-12-01 09:20:00', 'Thanh toán gói VIP 12 tháng'),

-- sub 15 - Minh - Gói PT cá nhân
(15, 3500000, '2025-09-10 18:00:00', 'Thanh toán gói PT cá nhân 2 tháng'),

-- sub 17 - Long - Gói tiêu chuẩn (gói mới)
(17, 1300000, '2025-10-01 09:00:00', 'Thanh toán gói 3 tháng'),

-- sub 18 - Khánh - Gói nâng cao (đã hết hạn)
(18, 2400000, '2025-03-01 16:30:00', 'Thanh toán gói 6 tháng');

--------------------------------------------------
-- 6. Lịch sử sử dụng thiết bị (equipment_usage)
-- Tạo dữ liệu nhiều ngày, nhiều hội viên, nhiều thiết bị
--------------------------------------------------
INSERT INTO equipment_usage (member_id, equipment_id, use_date, start_time, end_time)
VALUES
(1, 1, '2025-11-10', '06:15:00', '07:00:00'),
(1, 4, '2025-11-10', '07:05:00', '07:35:00'),
(2, 2, '2025-11-10', '18:10:00', '18:50:00'),
(3, 3, '2025-11-10', '19:00:00', '19:45:00'),
(4, 5, '2025-11-10', '20:00:00', '20:40:00'),

(5, 1, '2025-11-11', '06:30:00', '07:10:00'),
(6, 8, '2025-11-11', '07:00:00', '07:50:00'),
(7, 2, '2025-11-11', '17:30:00', '18:20:00'),
(8, 3, '2025-11-11', '18:30:00', '19:15:00'),
(9, 4, '2025-11-11', '19:20:00', '19:50:00'),

(10, 1, '2025-11-12', '06:10:00', '06:55:00'),
(11, 5, '2025-11-12', '07:00:00', '07:40:00'),
(12, 8, '2025-11-12', '18:00:00', '18:50:00'),
(1, 3, '2025-11-12', '19:00:00', '19:45:00'),
(2, 9, '2025-11-12', '20:00:00', '20:30:00'),

(3, 1, '2025-11-13', '06:20:00', '07:05:00'),
(4, 6, '2025-11-13', '07:10:00', '07:40:00'),
(5, 2, '2025-11-13', '18:15:00', '18:55:00'),
(6, 8, '2025-11-13', '19:00:00', '19:50:00'),
(7, 4, '2025-11-13', '20:00:00', '20:35:00'),

(8, 1, '2025-11-14', '06:25:00', '07:10:00'),
(9, 3, '2025-11-14', '07:15:00', '08:00:00'),
(10, 2, '2025-11-14', '18:05:00', '18:45:00'),
(11, 4, '2025-11-14', '18:50:00', '19:20:00'),
(12, 8, '2025-11-14', '19:30:00', '20:10:00'),

(1, 1, '2025-11-16', '06:10:00', '06:55:00'),
(2, 8, '2025-11-16', '07:00:00', '07:45:00'),
(3, 3, '2025-11-16', '08:00:00', '08:40:00'),
(4, 5, '2025-11-16', '18:00:00', '18:35:00'),
(5, 2, '2025-11-16', '18:40:00', '19:20:00'),
(6, 8, '2025-11-16', '19:30:00', '20:15:00');

INSERT INTO members (full_name, dob, gender, phone, address)
VALUES
('Ngô Minh Tâm', '1993-02-11', 'Nam', '0901000013', 'Cần Thơ'),
('Huỳnh Thị Mỹ Linh', '1997-09-18', 'Nữ', '0901000014', 'Cần Thơ'),
('Võ Chí Hiếu', '1986-04-22', 'Nam', '0901000015', 'Cần Thơ'),
('Phạm Trúc Vy', '1999-01-30', 'Nữ', '0901000016', 'Cần Thơ'),
('Trần Quốc Phong', '1990-08-09', 'Nam', '0901000017', 'Cần Thơ');

INSERT INTO subscriptions (member_id, package_id, start_date, end_date, status, paid)
VALUES
(13, 1, '2025-11-10', '2025-12-09', 'Đang hoạt động', 0),
(14, 2, '2025-11-05', '2026-02-04', 'Đang hoạt động', 0),
(15, 5, '2025-11-12', '2025-12-11', 'Đang hoạt động', 0),
(16, 3, '2025-11-01', '2026-05-01', 'Đang hoạt động', 0),
(17, 6, '2025-11-14', '2026-01-13', 'Đang hoạt động', 0);

INSERT INTO subscriptions (member_id, package_id, start_date, end_date, status, paid)
VALUES
(13, 3, '2025-04-01', '2025-09-30', 'Hết hạn', 1),
(14, 1, '2025-10-01', '2025-10-31', 'Hết hạn', 1),
(15, 2, '2025-06-01', '2025-08-31', 'Hết hạn', 1),
(16, 5, '2025-09-10', '2025-10-09', 'Hết hạn', 1),
(17, 4, '2024-11-01', '2025-10-31', 'Hết hạn', 1);

