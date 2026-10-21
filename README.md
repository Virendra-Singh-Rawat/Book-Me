# BookMe – SaaS Appointment Booking Platform

BookMe is a full-stack SaaS appointment booking platform built using the MERN stack (MongoDB, Express.js, React.js, and Node.js). It enables business owners to create and manage their services, configure availability, and accept online bookings through a personalized public booking page.

The platform simplifies appointment scheduling by allowing customers to browse available services, select convenient time slots, and verify their email addresses using OTP authentication before booking. For paid appointments, BookMe integrates Razorpay to facilitate online payments and verify payment status before confirming bookings.

### Key Features

- **Business Management:** Business owners can manage their profiles, customize their business details, and create and maintain services.
- **Public Booking Pages:** Each business gets a shareable booking URL that customers can use to book appointments without accessing the business dashboard.
- **Availability Management:** Configure availability and generate bookable time slots to help prevent scheduling conflicts.
- **Email OTP Verification:** Verify customer email addresses before creating bookings.
- **Razorpay Integration:** Create payment orders and verify transactions for paid bookings.
- **Email Notifications:** Send transactional emails for OTP verification and booking-related updates using Brevo.
- **Google Calendar Integration:** Connect Google Calendar to synchronize appointments and generate customer calendar links.
- **Wallet and Withdrawals:** Track provider payouts, manage withdrawal requests, and maintain transaction records.
- **Admin Dashboard:** View platform statistics, manage users and withdrawals, and monitor booking and payment activity.
- **Authentication and Authorization:** Use JWT-based authentication and protected routes to control access to administrative and business features.

### Tech Stack

- **Frontend:** React.js
- **Backend:** Node.js and Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JSON Web Tokens (JWT), bcrypt, and email OTP
- **Payments:** Razorpay
- **Email Service:** Brevo
- **Calendar:** Google Calendar integration

### Project Goal

The goal of BookMe is to build a practical, scalable SaaS application that brings appointment scheduling, customer verification, payment processing, and business management together in one platform. The project demonstrates full-stack development, REST API design, database modeling, third-party API integration, authentication, and payment workflow implementation.