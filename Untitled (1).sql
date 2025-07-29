CREATE DATABASE Anttend;
USE Anttend;

CREATE TABLE `role` (
  `role_id` int auto_increment PRIMARY KEY,
  `name_role` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE `status` (
  `id_status` int auto_increment PRIMARY KEY,
  `name_status` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE `location` (
  `id_location` int auto_increment PRIMARY KEY,
  `name_location` VARCHAR(255),
  `longitude` VARCHAR(255),
  `latitude` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE `staff` (
  `id_staff` VARCHAR(255) PRIMARY KEY,
  `name` VARCHAR(255),
  `email` VARCHAR(255),
  `birth` DATETIME,
  `phone` VARCHAR(255),
  `password` VARCHAR(255),
  `status` BOOLEAN,
  `avatar` VARCHAR(255),
  `role_id` int,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`role_id`) REFERENCES `role`(`role_id`)
);

CREATE TABLE `attend` (
  `id_attend` int auto_increment PRIMARY KEY,
  `date` INT,
  `month` INT,
  `year` INT,
  `checkin_time` TIME,
  `checkout_time` TIME,
  `description` LONGTEXT null,
  `id_staff` VARCHAR(255),
  `id_status` int,
  `longitude` VARCHAR(255),
  `latitude` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_staff`) REFERENCES `staff`(`id_staff`),
  FOREIGN KEY (`id_status`) REFERENCES `status`(`id_status`)
);

CREATE TABLE `logLogin` (
  `id` int auto_increment PRIMARY KEY,
  `staff_id` VARCHAR(255) null,
  `description` text,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE `logRegister` (
  `id` int auto_increment PRIMARY KEY,
  `staff_id` VARCHAR(255),
  `description` text,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE `logCheckIn` (
  `id` int auto_increment PRIMARY KEY,
  `staff_id` VARCHAR(255),
  `description` text,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE `logCheckOut` (
  `id` int auto_increment PRIMARY KEY,
  `staff_id` VARCHAR(255),
  `description` text,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO status (name_status) VALUES ('đi làm');
INSERT INTO status (name_status) VALUES ('nghỉ phép');
INSERT INTO status (name_status) VALUES ('nghỉ không phép');

INSERT INTO role (name_role) VALUES ('Admin');
INSERT INTO role (name_role) VALUES ('Staff');

INSERT INTO location (`name_location`,`longitude`,`latitude`) VALUES ('APEC Chủ sở chính','106.6265117','10.7485338');

INSERT INTO staff (id_staff,name,email,birth,phone,password,status,avatar,role_id) VALUES ('NV000','admin','apec@gmail.com','1990-01-01','0123456789','$2a$10$m5K5kx8cmCRYoXwRG6RoR.sLpvGmiQeBFQPGvcOp5vz2.miEGqeo6',true,'https://t4.ftcdn.net/jpg/06/41/80/67/240_F_641806775_YhKnnKoxppFGjT0Zg9f3KVgkW5VGiyHu.jpg',1);


