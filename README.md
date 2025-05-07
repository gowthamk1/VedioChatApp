# VedioChatApp

VedioChatApp is a real-time video chat application built using WebRTC for peer-to-peer video communication and Supabase SQL for persistent text chat storage. The frontend is hosted on Netlify, while the backend is deployed on Heroku.

### 🌐 Live Demo

* **Live Website:** [VedioChatApp](https://vediochatapplication.netlify.app/)

## 🚀 Features

* Real-time video and audio communication using WebRTC.
* Instant text chat with persistent message storage using Supabase SQL.
* Simple and intuitive user interface built with React.
* Deployed for seamless global access using Netlify (frontend) and Heroku (backend).

## 🗂️ Project Structure

```
VedioChatApp/
├── client/
│   ├── build/
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   ├── .env
│   ├── .gitignore
│   ├── package-lock.json
│   └── package.json
├── node_modules/
├── .env
├── .gitignore
├── db.js
├── index.js
├── package-lock.json
├── package.json
├── Procfile
└── README.md
```

## 🛠️ Tech Stack

* **Frontend:** React, WebRTC
* **Backend:** Node.js, Socket.IO, Express.js
* **Database:** Supabase SQL (PostgreSQL)
* **Deployment:** Netlify (Frontend), Heroku (Backend)

## 📝 Environment Variables

Create a `.env` file in both the root and `client` directories with the following variables:

### Backend (`.env`)

```
DATABASE_URL=postgresql://postgres:<Password>@db.xpjfbpvobqwfnadcxqpu.supabase.co:5432/postgres
CLIENT_URL=https://vediochatapplication.netlify.app/
REACT_APP_BACKEND_URL=http://localhost:8000
```

### Frontend (`client/.env`)

```
REACT_APP_BACKEND_URL=https://vediochatapp-server-fb3a15c736f5.herokuapp.com
```

## 📦 Installation

1. Clone the repository:

```
git clone https://github.com/gowthamk1/VedioChatApp.git
```

2. Install dependencies:

```
cd VedioChatApp
npm install
cd client
npm install
```

3. Run the application locally:

```
cd ..
npm start
```

## 🚀 Deployment

* Frontend (Netlify)
* Backend (Heroku) with a `Procfile` for easy deployment

## 📧 Contact

For any inquiries, reach out at [gowthamkpvt@gmail.com](mailto:gowthamkpvt@gmail.com).
