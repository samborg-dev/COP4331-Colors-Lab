-- Schema from the README's setup steps, plus known data for the integration tests.
-- Safe to re-run: it resets both tables.

CREATE DATABASE IF NOT EXISTS COP4331;
USE COP4331;

DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Colors;

CREATE TABLE Users (
  ID        INT         NOT NULL AUTO_INCREMENT,
  FirstName VARCHAR(50) NOT NULL DEFAULT '',
  LastName  VARCHAR(50) NOT NULL DEFAULT '',
  Login     VARCHAR(50) NOT NULL DEFAULT '',
  Password  VARCHAR(50) NOT NULL DEFAULT '',
  PRIMARY KEY (ID)
) ENGINE = InnoDB;

CREATE TABLE Colors (
  ID     INT         NOT NULL AUTO_INCREMENT,
  Name   VARCHAR(50) NOT NULL DEFAULT '',
  UserID INT         NOT NULL DEFAULT '0',
  PRIMARY KEY (ID)
) ENGINE = InnoDB;

-- Passwords are MD5 hashes: "COP4331" and "secret"
INSERT INTO Users (ID, FirstName, LastName, Login, Password) VALUES
  (1, 'Aashish', 'Yadavally', 'AYadavally', '5832a71366768098cceb7095efb774f2'),
  (2, 'Grace',   'Hopper',    'GHopper',    '5ebe2294ecd0e0f08eab7690d2a6ee69');

INSERT INTO Colors (Name, UserID) VALUES
  ('Blue', 1), ('Magenta', 1), ('Beige', 1),
  ('Crimson', 2);
