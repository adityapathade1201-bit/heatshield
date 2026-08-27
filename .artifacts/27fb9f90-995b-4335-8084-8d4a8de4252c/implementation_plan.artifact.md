# Implementation Plan - HeatWatch Android Application

This plan outlines the steps to build the HeatWatch Android mobile application using Capacitor, reusing the existing React/Vite frontend and FastAPI backend.

## User Review Required

> [!IMPORTANT]
> The application will reuse existing React components and API logic. The web dashboard will remain functional as the mobile app will be integrated as a conditional view or separate routes within the same project.
> QR scanning will be implemented using a Capacitor plugin. This requires camera permissions on the device.

## Proposed Changes

### Backend

#### [NEW] [observations.py](file:///C:/Users/ADITYA PATHADE/Music/HeatWatch/backend/routes/observations.py)
Create a new router for field observations ("Heat Check").

#### [MODIFY] [main.py](file:///C:/Users/ADITYA PATHADE/Music/HeatWatch/backend/main.py)
Register the new observations router.

### Frontend

#### [MODIFY] [package.json](file:///C:/Users/ADITYA PATHADE/Music/HeatWatch/frontend/package.json)
Add Capacitor dependencies and plugins.

#### [NEW] [capacitor.config.ts](file:///C:/Users/ADITYA PATHADE/Music/HeatWatch/frontend/capacitor.config.ts)
Configure Capacitor for the project.

#### [MODIFY] [App.tsx](file:///C:/Users/ADITYA PATHADE/Music/HeatWatch/frontend/src/App.tsx)
Implement conditional rendering for mobile view and bottom navigation.

#### [NEW] [MobileHome.tsx](file:///C:/Users/ADITYA PATHADE/Music/HeatWatch/frontend/src/pages/MobileHome.tsx)
Home screen with current heat risk and quick actions.

#### [NEW] [HeatCheck.tsx](file:///C:/Users/ADITYA PATHADE/Music/HeatWatch/frontend/src/pages/HeatCheck.tsx)
Field interface for ground-condition checks.

#### [NEW] [Survey.tsx](file:///C:/Users/ADITYA PATHADE/Music/HeatWatch/frontend/src/pages/Survey.tsx)
Survey screen with Google Forms link and QR scanner.

#### [NEW] [Profile.tsx](file:///C:/Users/ADITYA PATHADE/Music/HeatWatch/frontend/src/pages/Profile.tsx)
Profile/Settings screen.

#### [MODIFY] [api.ts](file:///C:/Users/ADITYA PATHADE/Music/HeatWatch/frontend/src/services/api.ts)
Add endpoints for observations and make API URL configurable.

## Verification Plan

### Automated Tests
- `npm run build` to ensure frontend still builds correctly.
- `npx cap sync android` to verify Capacitor synchronization.

### Manual Verification
- Open the Android project in Android Studio.
- Verify that the bottom navigation works as expected.
- Test the "Heat Check" submission (mocked or real endpoint).
- Test the QR scanner architecture (on-device).
- Ensure the web dashboard still works at `http://localhost:5173`.
