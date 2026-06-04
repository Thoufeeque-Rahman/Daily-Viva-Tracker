# Daily Viva Tracker

A modern web application designed to streamline and enhance the process of tracking and managing student viva evaluations in educational institutions.

## 🌟 Features

### Core Features
- **Real-time Viva Tracking**: Record and monitor student viva performances instantly
- **Multi-subject Support**: Manage evaluations across different subjects and classes
- **Teacher Authentication**: Secure login system for authorized faculty members
- **Student Management**: Comprehensive student database with detailed performance records

### Advanced Features
- **Performance Analytics**: Interactive charts and graphs showing student progress
- **Subject-wise Analysis**: Detailed breakdown of performance by subject
- **Evaluation History**: Complete record of all viva sessions with search and filter
- **Edit & Delete**: Manage past evaluations with ease
- **Color-coded Interface**: Visual indicators for different performance levels

## 🛠️ Tech Stack

### Frontend
- React with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Context API for state management
- Custom UI components
- Responsive design

### Backend
- Node.js with Express
- MongoDB for database
- JWT for authentication
- Session management
- RESTful API architecture

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/daily-viva-tracker.git
cd daily-viva-tracker
```

2. Install dependencies:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
VITE_FRONT_URL=your_frontend_url
```

4. Start the development servers:
```bash
# Start backend server
cd server
npm run dev

# Start frontend server
cd ../client
npm run dev
```

## 🔒 Security

- Secure authentication with JWT
- Protected API endpoints
- Encrypted data transmission
- Session management
- CORS protection

## 📱 Responsive Design

The application is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile phones

## 🌐 Live Demo

Visit the live application at: [Daily Viva Tracker](https://daily-viva-tracker.onrender.com)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **Dev Tropicks** - *Initial work*

## 🙏 Acknowledgments

- Thanks to all contributors who have helped shape this project
- Special thanks to the educational institutions that provided valuable feedback 