# SafeRoute

A mobile application that helps users navigate safely by providing crime prediction and safe route recommendations.

## Project Structure

```
SafeRoute/
├── frontend/          # React Native (Expo) application
│   ├── app/          # App screens and navigation
│   ├── assets/       # Images and other static files
│   ├── components/   # Reusable React components
│   └── services/     # API and authentication services
└── backend/          # Django backend (to be implemented)
```

## Getting Started

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npx expo start
```

3. Run on your device:
   - Install Expo Go on your iOS/Android device
   - Scan the QR code with your camera (iOS) or Expo Go app (Android)

### Environment Setup

1. Google OAuth Configuration:
   - Ensure you have access to the Google Cloud Console
   - Use the iOS client ID provided by the team
   - The bundle identifier is `com.saferoute.app`

## Features Implemented

- [x] Google Authentication
- [x] Modern UI with consistent design
- [x] Tab-based navigation
- [ ] Map integration (coming soon)
- [ ] Crime statistics (coming soon)
- [ ] Backend integration (coming soon)

## Contributing

1. Create a new branch for your feature:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit:
```bash
git add .
git commit -m "Description of your changes"
```

3. Push your changes and create a pull request:
```bash
git push origin feature/your-feature-name
```

## Tech Stack

- Frontend:
  - React Native (Expo)
  - Expo Router for navigation
  - Google Sign-In
  - FontAwesome icons
  - Custom UI components

- Backend (Planned):
  - Django
  - Django REST Framework
  - PostgreSQL
  - JWT Authentication 