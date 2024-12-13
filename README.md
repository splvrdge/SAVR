# SAVR - Financial Tracker App 💰

<div align="center">

<h1>
  <img src="assets/icons/savr-green.png" alt="SAVR Logo" width="300"/>
</h1>

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

SAVR is a modern financial tracking application built with React Native and Expo, designed to help users manage their expenses and income efficiently.

</div>

## ✨ Features

- 📱 Cross-platform (iOS & Android)
- 💳 Track expenses and income
- 📊 Visual analytics and reports
- 🎯 Set and track financial goals
- 🔐 Secure authentication
- 📱 User-friendly interface

## ⚠️ Important Notice

This application is hosted on Render's free tier, which means:
- The server automatically spins down after 15 minutes of inactivity
- Initial requests after inactivity may take 50 seconds or more to respond
- Please be patient during the initial load as the server spins up

## 🚀 Quick Start

### Option 1: Using Docker (Recommended)

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Clone the repository
```bash
git clone https://github.com/splvrdge/savr-finance-tracker.git
cd FRONTEND
```

3. Build and run with Docker
```bash
docker build -t savr-fintracker .
docker run -it -p 19000:19000 -p 19001:19001 -p 19002:19002 savr-fintracker
```

### Option 2: Manual Installation

#### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (optional)

#### Steps

1. Clone the repository
```bash
git clone https://github.com/splvrdge/savr-finance-tracker.git
cd FRONTEND
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Start the development server
```bash
npx expo start
```

### Running the App

After starting the development server, you can:
- Press `i` to open in iOS simulator
- Press `a` to open in Android emulator
- Scan the QR code with Expo Go app on your physical device

## 🛠️ Tech Stack

### Frontend
- [React Native](https://reactnative.dev/) - Mobile framework
- [Expo](https://expo.dev/) - Development platform
- [TypeScript](https://www.typescriptlang.org/) - Programming language
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [React Navigation](https://reactnavigation.org/) - Navigation
- [Docker](https://www.docker.com/) - Containerization

### Backend
- [Express.js](https://expressjs.com/) - Backend framework
- [MySQL](https://www.mysql.com/) - Database
- [Render](https://render.com/) - Cloud hosting platform

## 👥 Authors

- **Francis James A. Lagang** - _Lead Developer_ - [GitHub](https://github.com/splvrdge)
- **Margaret Grace Docdoc** - _Developer_ - [GitHub](https://github.com/dushaaaa)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/splvrdge/savr-finance-tracker/issues).

---

<div align="center">

Made with ❤️ by Francis James Lagang and Margaret Grace Docdoc

</div>
