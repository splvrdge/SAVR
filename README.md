# SAVR: Personal Finance Tracker

<div align="center">
  <img src="./assets/images/SAVR-Banner.png" alt="SAVR Banner" width="800"/>
</div>

> A comprehensive mobile application for tracking personal finances and achieving financial goals.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

## Overview

Submitted by:
| Name | Role |
|------|------|
| Francis James Lagang | Student |
| Margaret Grace Docdoc | Student |

*Final Project for CS 3105, DCISM, University of San Carlos. December 2024.*

> [!NOTE]  
> SAVR is designed to help users track their finances, set goals, and make informed financial decisions through comprehensive analytics and an intuitive interface.

## Table of Contents
- [Features](#features)
- [Analytics](#analytics)
- [Getting Started](#getting-started)
- [Tech Stack](#tech-stack)
- [Development](#development)
- [Contributing](#contributing)

## <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Sparkles.png" alt="Features" width="25" /> Features

> [!TIP]
> SAVR offers a comprehensive suite of features designed to make personal finance management effortless:
> - <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Mobile%20Phone.png" alt="Mobile" width="20" /> Cross-platform support (iOS & Android)
> - <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Credit%20Card.png" alt="Card" width="20" /> Expense and income tracking
> - <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Bar%20Chart.png" alt="Analytics" width="20" /> Advanced analytics dashboard
> - <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Bullseye.png" alt="Goal" width="20" /> Goal setting and tracking
> - <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Locked.png" alt="Security" width="20" /> Secure authentication
> - <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/People/Bust%20in%20Silhouette.png" alt="Profile" width="20" /> Personalized profiles
> - <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Chart%20Increasing.png" alt="Updates" width="20" /> Real-time updates

## <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Bar%20Chart.png" alt="Analytics" width="25" /> Analytics

Our analytics suite provides deep insights into your financial habits:

| Feature | Description |
|---------|-------------|
| Weekly Analysis | Track spending patterns week by week |
| Monthly Overview | Comprehensive monthly financial summary |
| Custom Reports | Detailed reports by category and time period |
| Visual Insights | Interactive charts and graphs |

> [!IMPORTANT]  
> The analytics dashboard updates in real-time as you add transactions, providing immediate insights into your spending patterns.

## <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Rocket.png" alt="Getting Started" width="25" /> Getting Started

> [!NOTE]  
> Choose your preferred installation method below. Docker is recommended for the most consistent development experience.

### Docker Installation (Recommended)

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Clone and setup:
```bash
git clone https://github.com/splvrdge/savr-finance-tracker.git
cd savr-finance-tracker
docker build -t savr-fintracker .
npx expo start
```

### Manual Installation

> [!CAUTION]
> Ensure you have all prerequisites installed to avoid setup issues:
> - Node.js (v14 or higher)
> - npm or yarn
> - Expo CLI
> - iOS Simulator or Android Emulator (optional)

```bash
# Clone repository
git clone https://github.com/splvrdge/savr-finance-tracker.git
cd savr-finance-tracker

# Install dependencies
npm install
# or
yarn install

# Start development server
npx expo start
```

### Running the App

After starting the development server:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your device

> [!WARNING]  
> The application is hosted on Render's free tier:
> - Server spins down after 15 minutes of inactivity
> - Initial requests may take up to 50 seconds
> - Please be patient during initial load times

## <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Hammer%20and%20Wrench.png" alt="Tech Stack" width="25" /> Tech Stack

### Frontend
- **React Native**: Mobile application framework
- **Expo**: Development platform
- **TypeScript**: Programming language
- **TailwindCSS**: Styling framework

### Backend
- **Express.js**: Web application framework
- **MySQL**: Database management
- **Docker**: Containerization

### Development Tools
- **Git**: Version control
- **GitHub Actions**: CI/CD
- **ESLint**: Code linting
- **Prettier**: Code formatting

## <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Laptop.png" alt="Development" width="25" /> Development

> [!TIP]
> For the best development experience:
> - Use VSCode with recommended extensions
> - Follow the TypeScript style guide
> - Test on both iOS and Android platforms
> - Use the Docker development environment

## <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Handshake.png" alt="Contributing" width="25" /> Contributing

> [!NOTE]  
> We welcome contributions! Please:
> 1. Fork the repository
> 2. Create a feature branch
> 3. Submit a pull request
> 4. Follow our coding standards

---
<div align="center">
<img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Graduation%20Cap.png" alt="University" width="30" />

University of San Carlos - Department of Computer and Information Sciences and Mathematics

*Making personal finance management accessible to everyone*
</div>
