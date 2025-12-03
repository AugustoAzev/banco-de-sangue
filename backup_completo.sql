/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.8.3-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: banco_sangue
-- ------------------------------------------------------
-- Server version	11.8.3-MariaDB-1+b1 from Debian

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `alembic_version`
--

DROP TABLE IF EXISTS `alembic_version`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `alembic_version` (
  `version_num` varchar(32) NOT NULL,
  PRIMARY KEY (`version_num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alembic_version`
--

LOCK TABLES `alembic_version` WRITE;
/*!40000 ALTER TABLE `alembic_version` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `alembic_version` VALUES
('9b11a34c37da');
/*!40000 ALTER TABLE `alembic_version` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `doacoes`
--

DROP TABLE IF EXISTS `doacoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `doacoes` (
  `id_doacao` varchar(36) NOT NULL,
  `data_doacao` datetime DEFAULT current_timestamp(),
  `volume_ml` float NOT NULL,
  `observacoes` text DEFAULT NULL,
  `status` enum('EM_ESTOQUE','DESPACHADA','DESCARTADA') NOT NULL,
  `tipo_sanguineo_coletado` enum('A_POSITIVO','A_NEGATIVO','B_POSITIVO','B_NEGATIVO','AB_POSITIVO','AB_NEGATIVO','O_POSITIVO','O_NEGATIVO') NOT NULL,
  `id_doador` varchar(36) NOT NULL,
  `id_registrador` varchar(36) NOT NULL,
  `id_unidade` varchar(36) NOT NULL,
  `criado_em` datetime DEFAULT current_timestamp(),
  `atualizado_em` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_doacao`),
  KEY `id_doador` (`id_doador`),
  KEY `id_registrador` (`id_registrador`),
  KEY `ix_doacoes_id_unidade` (`id_unidade`),
  CONSTRAINT `doacoes_ibfk_1` FOREIGN KEY (`id_doador`) REFERENCES `doadores` (`id_doador`),
  CONSTRAINT `doacoes_ibfk_2` FOREIGN KEY (`id_registrador`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `doacoes_ibfk_3` FOREIGN KEY (`id_unidade`) REFERENCES `unidades_coleta` (`id_unidade`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doacoes`
--

LOCK TABLES `doacoes` WRITE;
/*!40000 ALTER TABLE `doacoes` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `doacoes` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `doadores`
--

DROP TABLE IF EXISTS `doadores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `doadores` (
  `id_doador` varchar(36) NOT NULL,
  `nome_completo` varchar(255) NOT NULL,
  `cpf` varchar(14) NOT NULL,
  `idade` int(11) DEFAULT NULL,
  `sexo` varchar(20) DEFAULT NULL,
  `tipo_sanguineo` enum('A_POSITIVO','A_NEGATIVO','B_POSITIVO','B_NEGATIVO','AB_POSITIVO','AB_NEGATIVO','O_POSITIVO','O_NEGATIVO') DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `endereco` varchar(255) DEFAULT NULL,
  `criado_em` datetime DEFAULT current_timestamp(),
  `atualizado_em` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_doador`),
  UNIQUE KEY `ix_doadores_cpf` (`cpf`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doadores`
--

LOCK TABLES `doadores` WRITE;
/*!40000 ALTER TABLE `doadores` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `doadores` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `unidades_coleta`
--

DROP TABLE IF EXISTS `unidades_coleta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `unidades_coleta` (
  `id_unidade` varchar(36) NOT NULL,
  `nome_fantasia` varchar(255) NOT NULL,
  `cnpj` varchar(20) DEFAULT NULL,
  `endereco` varchar(255) NOT NULL,
  `email_unidade` varchar(255) DEFAULT NULL,
  `criado_em` datetime DEFAULT current_timestamp(),
  `atualizado_em` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_unidade`),
  UNIQUE KEY `ix_unidades_coleta_cnpj` (`cnpj`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `unidades_coleta`
--

LOCK TABLES `unidades_coleta` WRITE;
/*!40000 ALTER TABLE `unidades_coleta` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `unidades_coleta` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id_usuario` varchar(36) NOT NULL,
  `nome_completo` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `senha_hash` varchar(255) NOT NULL,
  `cpf` varchar(14) DEFAULT NULL,
  `pis` varchar(20) DEFAULT NULL,
  `cargo` varchar(100) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `tipo` enum('ADMINISTRADOR','ATENDENTE') NOT NULL,
  `criado_em` datetime DEFAULT current_timestamp(),
  `atualizado_em` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `ix_usuarios_email` (`email`),
  UNIQUE KEY `pis` (`pis`),
  UNIQUE KEY `ix_usuarios_cpf` (`cpf`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `usuarios` VALUES
('727fece3-abfe-41c5-8020-ef17793fa5ed','Usuário de Teste','teste@gmail.com','$2b$12$9zirwrDSK9v/tBMfpeaLGuS2FtpoT82A73qoq12NAfcUU0L3HeKHm','000.000.000-00',NULL,'Tester',NULL,'ADMINISTRADOR','2025-12-03 18:22:42','2025-12-03 18:22:42');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `usuarios_unidades`
--

DROP TABLE IF EXISTS `usuarios_unidades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios_unidades` (
  `id_usuario` varchar(36) NOT NULL,
  `id_unidade` varchar(36) NOT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id_usuario`,`id_unidade`),
  KEY `id_unidade` (`id_unidade`),
  CONSTRAINT `usuarios_unidades_ibfk_1` FOREIGN KEY (`id_unidade`) REFERENCES `unidades_coleta` (`id_unidade`),
  CONSTRAINT `usuarios_unidades_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios_unidades`
--

LOCK TABLES `usuarios_unidades` WRITE;
/*!40000 ALTER TABLE `usuarios_unidades` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `usuarios_unidades` ENABLE KEYS */;
UNLOCK TABLES;
commit;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2025-12-03 18:36:36
