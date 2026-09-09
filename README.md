# COLORS

A small web application built for COP 4331 (Processes of Object-Oriented Software
Development) to demonstrate a working LAMP stack end to end.

Each user has a private list of color names. After logging in you can add colors
to your own list and search it by substring. One user's colors are never visible
to another. The application is intentionally small -- the point is a complete
path from browser to database and back, not a large feature set.

Live instance: https://cop4331.lol/

## Screens

- **`index.html`** -- login page. Submits a username and password, and on success
  stores the user's identity in a cookie and forwards to the color page.
- **`color.html`** -- the main page. Shows who is logged in, and provides an
  "add a color" field and a "search colors" field, plus a log out button.

## Technologies

| Layer      | Technology                                       |
| ---------- | ------------------------------------------------ |
| OS         | Ubuntu 24.04 LTS (DigitalOcean droplet)          |
| Web server | Apache 2                                         |
| Database   | MySQL 8                                          |
| Backend    | PHP 8 (`mysqli`, prepared statements)            |
| Frontend   | HTML, CSS, vanilla JavaScript (`XMLHttpRequest`) |

No frameworks, package managers, or build step. The files are served as-is.

## Repository layout

```
.
├── LAMPAPI/            API endpoints (one PHP file per endpoint)
│   ├── AddColor.php
│   ├── Login.php
│   └── SearchColors.php
├── css/styles.css
├── images/background.png
├── js/
│   ├── code.js         all client-side logic and API calls
│   └── md5.js          third-party MD5 implementation
├── color.html
├── index.html
├── LICENSE.md
└── README.md
```

This mirrors the directory structure the server expects: everything sits directly
in Apache's web root, with the API in a `LAMPAPI/` subdirectory.

## API

All three endpoints accept `POST` with a JSON body and return JSON. Every response
carries an `error` field, which is an empty string on success.

| Endpoint                   | Request             | Response                               |
| -------------------------- | ------------------- | -------------------------------------- |
| `LAMPAPI/Login.php`        | `login`, `password` | `id`, `firstName`, `lastName`, `error` |
| `LAMPAPI/AddColor.php`     | `color`, `userId`   | `error`                                |
| `LAMPAPI/SearchColors.php` | `search`, `userId`  | `results` (array of strings), `error`  |

`password` is expected to already be MD5-hashed by the client. A failed login
returns `id: 0` rather than an HTTP error status.

Example:

```bash
curl -X POST http://159.89.233.90/LAMPAPI/Login.php \
  -H "Content-Type: application/json" \
  -d '{"login":"AYadavally","password":"5832a71366768098cceb7095efb774f2"}'
```

## Setup

Assumes a fresh Ubuntu server with Apache, MySQL, and PHP installed. A
DigitalOcean LAMP droplet arrives with all three already in place.

**1. Create the database and tables.**

Connect with `mysql -u root -p`, then:

```sql
CREATE DATABASE COP4331;
USE COP4331;

CREATE TABLE `COP4331`.`Users` (
  `ID`        INT         NOT NULL AUTO_INCREMENT,
  `FirstName` VARCHAR(50) NOT NULL DEFAULT '',
  `LastName`  VARCHAR(50) NOT NULL DEFAULT '',
  `Login`     VARCHAR(50) NOT NULL DEFAULT '',
  `Password`  VARCHAR(50) NOT NULL DEFAULT '',
  PRIMARY KEY (`ID`)
) ENGINE = InnoDB;

CREATE TABLE `COP4331`.`Colors` (
  `ID`     INT         NOT NULL AUTO_INCREMENT,
  `Name`   VARCHAR(50) NOT NULL DEFAULT '',
  `UserID` INT         NOT NULL DEFAULT '0',
  PRIMARY KEY (`ID`)
) ENGINE = InnoDB;
```

**2. Create a database user for the application.**

Do not let the app connect as root. Choose your own password here:

```sql
CREATE USER 'your_db_user' IDENTIFIED BY 'your_db_password';
GRANT ALL PRIVILEGES ON COP4331.* TO 'your_db_user'@'%';
```

**3. Add a login to test with.**

The `Password` column stores an MD5 hash, because the browser hashes the password
before sending it. Inserting a plaintext password produces an account that can
never log in. To create a user whose password is `COP4331`:

```sql
INSERT INTO Users (FirstName, LastName, Login, Password)
VALUES ('Aashish', 'Yadavally', 'AYadavally', '5832a71366768098cceb7095efb774f2');

INSERT INTO Colors (Name, UserID) VALUES ('Blue', 1), ('Magenta', 1), ('Beige', 1);
```

**4. Point the endpoints at your database.**

Each file in `LAMPAPI/` is committed with placeholder credentials:

```php
$conn = new mysqli("localhost", "username", "password", "database");
```

Replace those three values with the user, password, and database name from step 2,
in all three files. **These edits stay on the server and must not be committed** --
see [Credentials](#credentials) below.

**5. Copy the files to the web root.**

Everything in this repository goes directly into `/var/www/html`:

```bash
scp -r LAMPAPI css images js index.html color.html root@YOUR_SERVER_IP:/var/www/html/
```

Apache serves that directory with no further configuration.

## Running it

Visit `http://YOUR_SERVER_IP` (or your domain) in a browser. You will land on the
login page. Sign in with a user created in step 3, add a color, then search for it.
Searching with an empty field returns everything on your list.

Sessions last 20 minutes, after which the cookie expires and you are returned to
the login page.

## Credentials

The three PHP files are committed with placeholder database credentials, matching
the state in which they were distributed. The real values live only on the server
and are deliberately kept out of version control, along with anything else
specific to a single deployment.

If you clone this, step 4 above is required before the app will run.

## Assumptions and limitations

This is a teaching exercise, and several things in it would be unacceptable in
production:

- **Passwords are hashed with MD5, in the browser.** MD5 has been considered
  broken for years, and hashing client-side means the hash *is* the password as
  far as the server is concerned -- intercepting it is as good as stealing the
  plaintext. A real system would send the password over HTTPS and hash it
  server-side with bcrypt or Argon2, using a per-user salt.
- **The site is served over HTTP, not HTTPS.** All traffic, including logins, is
  in the clear. Certbot is preinstalled on the droplet and would fix this.
- **Identity is stored in a plain, unsigned cookie.** `code.js` reads `userId`
  straight out of `document.cookie` and sends it to the API, which trusts it.
  Editing that cookie in devtools would let you read another user's colors. There
  is no server-side session.
- **There is no registration page.** Users are inserted directly via SQL.
- **SQL injection is handled, but XSS is not.** The endpoints use prepared
  statements with bound parameters, so the queries are safe. Search results,
  however, are written into the page with `innerHTML` without escaping.
- **JSON responses are assembled by string concatenation** rather than
  `json_encode`, so a color name containing a quote or a backslash produces a
  malformed response.
- **No automated tests**, and no validation on color names or lengths.

These are known and left in place: the assignment is about getting a LAMP stack
working end to end, not about hardening it.

## AI usage

Claude was used to draft this README.md

## License

MIT -- see [LICENSE.md](LICENSE.md).
