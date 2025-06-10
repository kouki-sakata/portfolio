-- MySQL dump 10.13  Distrib 8.0.37, for Win64 (x86_64)
--
-- Host: localhost    Database: timemanagerdb
-- ------------------------------------------------------
-- Server version	8.0.37

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `employee`
--

DROP TABLE IF EXISTS `employee`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `first_name` varchar(30) NOT NULL COMMENT '姓',
  `last_name` varchar(30) NOT NULL COMMENT '名',
  `email` varchar(255) NOT NULL COMMENT 'メールアドレス',
  `password` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'パスワード',
  `admin_flag` int NOT NULL COMMENT '管理者フラグ',
  `update_date` timestamp NULL DEFAULT NULL COMMENT '更新日時',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='従業員情報';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `log_history`
--

DROP TABLE IF EXISTS `log_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `log_history` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `display_name` int DEFAULT NULL COMMENT '画面名',
  `operation_type` int DEFAULT NULL COMMENT '操作種別',
  `stamp_time` timestamp NULL DEFAULT NULL COMMENT '打刻時刻',
  `employee_id` int DEFAULT NULL COMMENT '従業員ID',
  `update_employee_id` int DEFAULT NULL COMMENT '更新従業員ID',
  `update_date` timestamp NULL DEFAULT NULL COMMENT '更新日時',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=240 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='履歴記録';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `news`
--

DROP TABLE IF EXISTS `news`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `news` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `news_date` varchar(10) DEFAULT NULL COMMENT 'お知らせ日付',
  `content` varchar(75) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '内容',
  `release_flag` tinyint(1) DEFAULT NULL COMMENT '公開フラグ',
  `update_date` timestamp NULL DEFAULT NULL COMMENT '更新日時',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='お知らせ情報';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stamp_history`
--

DROP TABLE IF EXISTS `stamp_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stamp_history` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `year` varchar(4) DEFAULT NULL COMMENT '年',
  `month` varchar(2) DEFAULT NULL COMMENT '月',
  `day` varchar(2) DEFAULT NULL COMMENT '日',
  `employee_id` int DEFAULT NULL COMMENT '従業員ID',
  `in_time` timestamp NULL DEFAULT NULL COMMENT '出勤時刻',
  `out_time` timestamp NULL DEFAULT NULL COMMENT '退勤時刻',
  `update_employee_id` int DEFAULT NULL COMMENT '更新従業員ID',
  `update_date` timestamp NULL DEFAULT NULL COMMENT '更新日時',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=103 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='打刻記録';
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-15 10:03:44
