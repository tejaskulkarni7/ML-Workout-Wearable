# Welcome to the mobile app for On-Device ML Workout Wearable 👋

This is an [Expo](https://expo.dev) React Native project. Backend service is provided by Appwrite. 

## Getting Started
### Option 1:
1. Install dependencies
   ```bash
   npm install
   ```
2. Start the app
   ```bash
    remember to go to your wifi connection settings and select Private connection (to allow access to other connections)
    npx expo login
    npx expo start --tunnel
   ```
3. Open the app
   ```bash
   you can run the app in ios or android emulators. The record page, however, requires a physical android device as it uses bluetooth.
   ```
### Option 2:
1. Open the .apk file provided in this repository on an Android device

## Key Features
The app has several key features/pages. Its primary use case is the record feature that allows users to record their workout. Once recording has started, the record page displays a live feed of heart rate data. The user is able to pause, resume, and stop the workout. Additional, supplementary, features are also provided.
   - A weekly workout summary
   - Workout goal creation and tracking
   - User settings (configure weight, logout, delete account)
   - Workout history (exercises, reps, duration, calories burnt, average heart rate)
   - Workout recording with live heart rate feed

## Usage
Start the app and create an account. Log in with those credentials. Configure your user weight in 'settings' if you would like to view calories burned. Create new goals in the goals page by clicking the 'plus' icon, selecting a particular exercise, and then selecting a count of reps.

Use the app when performing a workout of either bench press, deadlift, or squat. Have the wearable device turned on and strapped on to your right wrist. Right before starting the workout, hit the 'play' button twice on the Record page. This will start the workout and display a live graphical visualization of heart rate. Once the workout is complete, hit the big red stop button and wait for a few seconds. Then you may turn the wearable device off or repeat the same process for a different workout 'set'.

Observe each set being added to your workouts in the history page. Each workout can be clicked on to view more information. Observe working towards your goals with the progress bar. This can be found on the home page.
You may sign out, or delete your account from the settings page.

## Project Code Structure
app/: Contains the main application code, including:
tabs/: Core app screens like goals.tsx, history.tsx, login.tsx, record.tsx, settings.tsx, and signup.tsx.
lib/: Library files for external services:
    - appwrite.js - Appwrite SDK configuration and API calls. 
    - appwrite.test.js - Jest test file for Appwrite integration.
scripts/ - Utility scripts, such as reset-project.js for resetting the project.

Configuration Files:
app.json - Expo application configuration.
package.json - Project dependencies and scripts.
tsconfig.json - TypeScript configuration.

## Related Repositories:
   - https://github.com/tejaskulkarni7/ML-Workout-Wearable (Expo Mobile App)
   - https://github.com/AsianGod160/ml_workout_wearable (Combined IMU, heart rate, BLE, ML Model Code)
   - https://github.com/NealC17/senior_design/ (ML Model, Data Preprocessing)
