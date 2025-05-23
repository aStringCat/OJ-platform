# Kestrel Online Judge Platform

### About This Platform

Kestrel is an Online Judge (OJ) platform designed for practicing and competing in programming problems. Users can browse a list of problems, view individual problem details (including description, difficulty, and examples), and submit their code solutions in various languages (Python, JavaScript, Java, C++ and so on). The platform also includes functionality for administrators to add new problems.

The frontend is built with React and Vite, utilizing Material UI for components. The backend is powered by Node.js and Express, with MongoDB as the database.

### Getting Started

**Prerequisites:**

- Node.js (version >=18.x recommended)
- npm (comes with Node.js)
- MongoDB running locally (default connection is `mongodb://localhost:27017/mydatabase`)

**Setup and Running:**

1.  **Install Dependencies:**
    Open your terminal, navigate to the project's root directory, and run:

    ```bash
    npm install
    ```

2.  **Run the Backend Server:**
    In one terminal window, start the backend server:

    ```bash
    npm start
    ```

    This uses `nodemon` to run `server/server.js`, so the server will automatically restart if you make changes to backend files. The backend server runs on port 3000 by default.

3.  **Run the Frontend Development Server:**
    In a second terminal window, start the Vite frontend development server:

    ```bash
    npm run dev
    ```

    This will start the React application. The frontend development server typically runs on port 5173.

4.  **Access the Platform:**
    Open your web browser and navigate to:
    `http://localhost:5173`

    API requests from the frontend to `/api` will be proxied to the backend server running on `http://localhost:3000`.
