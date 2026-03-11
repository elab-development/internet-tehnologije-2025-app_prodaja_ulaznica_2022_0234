-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 11, 2026 at 07:00 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `prodaja_ulaznica`
--

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `role`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Admin', 'admin@tickets.rs', '2026-02-07 17:55:27', '$2y$12$gIRyGZPzqFT/6Kq5o//7XeHPtwagCPPFotFq1oPad63bgFhJ3kpxW', 'admin', NULL, '2026-02-07 17:55:27', '2026-02-07 17:56:06'),
(2, 'Lupe O\'Keefe', 'penelope.simonis@example.net', '2026-02-07 17:55:27', '$2y$12$n794y65JCk0ctyUc/f7L4el8TMDo.d6uzwyudGh9DsdC8TyMTrGqm', 'user', 'gedoUEunlI', '2026-02-07 17:55:28', '2026-02-07 17:55:28'),
(3, 'Catherine Quigley', 'xavier77@example.org', '2026-02-07 17:55:28', '$2y$12$n794y65JCk0ctyUc/f7L4el8TMDo.d6uzwyudGh9DsdC8TyMTrGqm', 'user', 'TPOiP6HroK', '2026-02-07 17:55:28', '2026-02-07 17:55:28'),
(4, 'Kaya Medhurst DDS', 'lizzie23@example.com', '2026-02-07 17:55:28', '$2y$12$n794y65JCk0ctyUc/f7L4el8TMDo.d6uzwyudGh9DsdC8TyMTrGqm', 'user', 'S37aGDxqXN', '2026-02-07 17:55:28', '2026-02-07 17:55:28'),
(5, 'Ulises Jacobs', 'upagac@example.net', '2026-02-07 17:55:28', '$2y$12$n794y65JCk0ctyUc/f7L4el8TMDo.d6uzwyudGh9DsdC8TyMTrGqm', 'user', 'PWZc7yYaGv', '2026-02-07 17:55:28', '2026-02-07 17:55:28'),
(6, 'Wellington Fritsch', 'blick.albertha@example.com', '2026-02-07 17:55:28', '$2y$12$n794y65JCk0ctyUc/f7L4el8TMDo.d6uzwyudGh9DsdC8TyMTrGqm', 'admin', 'ktW0U6gaQ5', '2026-02-07 17:55:28', '2026-02-07 17:55:28'),
(7, 'Marc Mueller DDS', 'jacques.nitzsche@example.org', '2026-02-07 17:55:28', '$2y$12$n794y65JCk0ctyUc/f7L4el8TMDo.d6uzwyudGh9DsdC8TyMTrGqm', 'user', 'YCvFIY30N2', '2026-02-07 17:55:28', '2026-02-08 22:46:29'),
(8, 'Murray Blanda I', 'rau.emmanuel@example.org', '2026-02-07 17:55:28', '$2y$12$n794y65JCk0ctyUc/f7L4el8TMDo.d6uzwyudGh9DsdC8TyMTrGqm', 'user', 'kRsFCukr5x', '2026-02-07 17:55:28', '2026-02-07 17:55:28'),
(9, 'Lolita Kutch', 'herzog.andy@example.net', '2026-02-07 17:55:28', '$2y$12$n794y65JCk0ctyUc/f7L4el8TMDo.d6uzwyudGh9DsdC8TyMTrGqm', 'user', 'YmX2W2QJGj', '2026-02-07 17:55:28', '2026-02-07 17:55:28'),
(10, 'Pera Peric', 'pera@tickets.rs', '2026-02-07 17:55:28', '$2y$12$rH8DGB7rmZn6aHH0nMs.JuTVnDzdsABbdZzAc4bLxnBLskD/tgApi', 'user', NULL, '2026-02-07 17:55:28', '2026-02-07 17:55:28'),
(11, 'Mika Mikic', 'mika@tickets.rs', '2026-02-07 17:55:29', '$2y$12$DjcTcHBGFl.ny1hGH4BTF.BTH2cBECw2fHbxYjZt5Vue1ad.GPL9K', 'user', NULL, '2026-02-07 17:55:29', '2026-02-07 17:55:29'),
(12, 'Milica Drljaca', 'milicadrljaca@gmail.com', NULL, '$2y$12$.eBm8yrxiOsJqVTJIIoYheUpxfb9VTHh.hmenJncwcx0jbq8dzloS', 'user', NULL, '2026-02-07 21:41:35', '2026-02-08 22:52:29');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD KEY `users_role_idx` (`role`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
