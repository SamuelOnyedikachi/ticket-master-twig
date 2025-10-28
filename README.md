# TicketMaster - Twig Implementation

This repository contains the Twig version of the Multi-Framework Ticket Web App. It's a robust, client-side ticket management application built with PHP, Twig for templating, and vanilla JavaScript for all logic and state management.

The application is fully responsive, features a dark/light mode, and provides a seamless user experience for managing support tickets.

## ✨ Core Features

- **Modern Landing Page**: A visually appealing hero section with a wavy SVG background and decorative elements.
- **Secure Authentication**: Simulated Login and Signup pages with client-side form validation and toast notifications.
- **Dynamic Dashboard**: An overview of ticket statistics, including KPI cards for active, open, in-progress, and closed tickets. Features an interactive doughnut chart and a list of recent tickets.
- **Full Ticket Management (CRUD)**:
  - **Create**: A clean form to create new tickets.
  - **Read**: A responsive grid displaying all active tickets.
  - **Update**: Edit existing tickets directly from the list.
  - **Soft Delete**: Move tickets to a "Trash" page instead of deleting them permanently.
- **Trash Functionality**: View all deleted tickets with options to **Restore** them or **Delete Permanently**.
- **Client-Side State**: All application data (session, tickets) is managed using the browser's `localStorage`.
- **Responsive Design**: A mobile-first approach with a collapsible navigation menu ensures a great experience on all devices.
- **Theming**: A beautiful dark/light mode toggle.
- **Interactive UI**: Smooth transitions, hover effects, and custom modals for a polished user experience.

## 🛠️ Tech Stack

- **Backend**: PHP (for serving the Twig templates)
- **Templating**: Twig
- **Frontend Logic**: Vanilla JavaScript (ES6+)
- **Styling**: TailwindCSS (via CDN)
- **Charting**: Chart.js (via CDN)
- **Dependencies**: Composer for managing PHP dependencies (Twig).

## 🚀 Setup and Execution

To run this project locally, you need a PHP server environment like XAMPP, WAMP, or MAMP.

1.  **Clone the Repository**:

    ```bash
    git clone <your-repository-url>
    ```

2.  **Install Dependencies**: Navigate to the project root and run Composer.

    ```bash
    composer install
    ```

3.  **Place in Web Server Directory**: Move the entire project folder (`ticket-master-twig`) into your web server's root directory (e.g., `htdocs` for XAMPP, `www` for WAMP).

4.  **Access the Application**: Open your web browser and navigate to the `public` directory.
    - Example URL: `http://localhost/ticket-master-twig/public/`

The application should now be running.

## 📂 Project Structure

```
/
├── public/                  # Web server root
│   ├── assets/              # Compiled CSS and JS
│   │   ├── app.css
│   │   └── app.js
│   └── index.php            # Main router and entry point
├── templates/               # All Twig template files
│   ├── _layout.twig         # Main layout template
│   ├── auth_login.twig
│   ├── auth_signup.twig
│   ├── dashboard.twig
│   ├── landing.twig
│   ├── tickets.twig
│   └── trash.twig
├── vendor/                  # Composer dependencies
├── composer.json
└── README.md                # This file
```

## 🗄️ State Management Structure

The application's state is managed entirely on the client-side using `localStorage`.

- **Session Key**: `ticketapp_session`

  - Stores a JSON object with the user's email and a fake session token upon successful login/signup.
  - Example: `{"email":"user@example.com","token":"fake-token"}`

- **Tickets Key**: `TicketMaster_tickets`
  - Stores a JSON array of all ticket objects. Each ticket includes an `id`, `title`, `status`, `description`, and an `isDeleted` flag.

## 👤 Test User Credentials

Authentication is simulated and does not require a real backend. You can use any of the following credentials to test the application:

- **Email**: Any valid email format (e.g., `test@example.com`)
- **Password**: Any password with at least 6 characters (e.g., `password`)

## ♿ Accessibility & Notes

- The application uses semantic HTML5 tags (`<header>`, `<main>`, `<footer>`, `<nav>`).
- Form inputs have associated `<label>` tags.
- Interactive elements have focus states for keyboard navigation.
- Color contrast has been considered for readability in both light and dark modes.

### Known Issues

- This is a **frontend-only simulation**. There is no real database or backend validation. All data will be lost if the browser's `localStorage` is cleared.
- The project relies on CDN links for TailwindCSS and Chart.js, so an internet connection is required for proper styling and functionality.

---
