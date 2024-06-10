### Library Management System - Group 50 (By Aldrin Alfred and Antony Jovious Nambely)

### Project Overview:
The Library Management System is designed to facilitate secure online access to a wide range of books. It ensures that users can sign up, sign in, verify email ID, reset their passwords securely. 

### Security Features:
* Register a user account with username, email and password  with strong validation checks.
* Securely login using email and password post email verification.
* Hashing of user passwords in the database, ensuring data integrity and security.
* Installation of self-signed SSL certificate to browser.

### Installation:
To run this project locally, follow these steps:

### Clone the Repository
To clone the repository, run the following command:
```
git clone https://github.com/aldrinalfred-dev/library-management-system.git
cd library-management-system
```

### Install project dependencies:
```
npm install
```

### Set Up Environment Variables:
Create a .env file in the root of your project and add the necessary environment variables. 
```
MONGODB_URI="mongodb+srv://<username>:<password>@librarycluster.lbtxv3l.mongodb.net/?retryWrites=true&w=majority&appName=LibraryCluster"
PORT=3000
EMAIL_USER=7da36bde21411a
EMAIL_PASS=35796500d07cc4
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
```

### Generate SSL Certificates 
Create a directory called /ssl

Run the following OpenSSL commands,
```
openssl genrsa -out key.pem 2048 # Generates private key
openssl req -new -key key.pem -out csr.pem # Generates CSR file
openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out cert.pem # Generates SSL cert file
```
### Run the application:
```
nodemon app.js
```
The application will be available at https://localhost:3000.

### Technologies Used
* HTML/CSS: Front end page design.
* Node.js: JavaScript runtime
* Express.js: Web framework for Node.js
* MongoDB: NoSQL database
* Postman: API testing
* MailTrap: Testing email functionality for development purposes

