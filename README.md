# SafeRoute - Crime Prediction App

A mobile application that helps users navigate safely by predicting crime hotspots and providing safe routes.

## Project Structure

```
crime-prediction-app/
├── frontend/                 # React Native + Expo app
├── backend/                  # Flask server
```

## Setup Instructions

### Frontend Setup
1. Navigate to the frontend directory
2. Install dependencies: `npm install`
3. Start the development server: `npm start`

### Backend Setup
1. Navigate to the backend directory
2. Create and activate virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies: `pip install -r requirements.txt`
4. Start the server: `python app.py`

## Features
- Real-time crime prediction
- Safe route navigation
- Crime reporting system
- User authentication
- Interactive map interface

## Technologies Used
- Frontend: React Native, Expo
- Backend: Flask, Python
- Machine Learning: Scikit-learn
- Database: Firebase 