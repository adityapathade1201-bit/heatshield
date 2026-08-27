# HeatWatch Mobile App - Visual & Functional Refinement Plan

This plan outlines the steps to transform the HeatWatch mobile application into a premium, weather-inspired experience with improved functionality and a modern visual system.

## User Review Required

> [!IMPORTANT]
> **Authentication:** The backend currently does not have authentication endpoints. I will implement the UI for Sign In/Sign Up and use `localStorage` to simulate an authenticated session. This will allow the app to function as requested while being ready for backend integration later.

> [!NOTE]
> **Permissions:** Location and Notification permissions will be requested using Capacitor plugins where available, but will be handled gracefully if denied.

## Proposed Changes

### [Theme & Global Styles]

#### [MODIFY] [tailwind.config.js](file:///C:/Users/ADITYA PATHADE/Music/HeatWatch/heatwatch-mobile/tailwind.config.js)
- Define a new color palette: `municipal-blue`, `sky-blue`, `heat-orange`, `heat-red`.
- Add custom shadows and border radii for a premium feel.

#### [MODIFY] [index.css](file:///C:/Users/ADITYA PATHADE/Music/HeatWatch/heatwatch-mobile/src/index.css)
- Replace the solid blue background with a subtle, atmospheric background system.
- Add utility classes for glassmorphism and soft gradients.

### [Core Components]

#### [MODIFY] [AppLayout.tsx](file:///C:/Users/ADITYA PATHADE/Music/HeatWatch/heatwatch-mobile/src/components/AppLayout.tsx)
- Integrate onboarding flow logic.
- Implement the atmospheric background that subtly reacts to weather/state.

#### [MODIFY] [BottomNavigation.tsx](file:///C:/Users/ADITYA PATHADE/Music/HeatWatch/heatwatch-mobile/src/components/BottomNavigation.tsx)
- Modernize the navigation bar with rounded containers and better icons.

### [Onboarding & Authentication]

#### [NEW] [Onboarding.tsx](file:///C:/Users/ADITYA PATHADE/Music/HeatWatch/heatwatch-mobile/src/pages/Onboarding.tsx)
- Step-by-step flow: Welcome -> Sign In -> Location Permission -> Notification Permission.

#### [NEW] [useAuth.ts](file:///C:/Users/ADITYA PATHADE/Music/HeatWatch/heatwatch-mobile/src/hooks/useAuth.ts)
- Hook to manage authentication state and onboarding progress.

### [Screen Redesigns]

#### [MODIFY] [Home.tsx](file:///C:/Users/ADITYA PATHADE/Music/HeatWatch/heatwatch-mobile/src/pages/Home.tsx)
- Improved visual hierarchy.
- Better weather icons and data presentation.
- Proper loading and error states.

#### [MODIFY] [Alerts.tsx](file:///C:/Users/ADITYA PATHADE/Music/HeatWatch/heatwatch-mobile/src/pages/Alerts.tsx)
- Redesigned alert cards with severity-based styling.
- Empty state for when no alerts are active.

#### [MODIFY] [HeatCheck.tsx](file:///C:/Users/ADITYA PATHADE/Music/HeatWatch/heatwatch-mobile/src/pages/HeatCheck.tsx)
- Improved option cards with meaningful icons.

#### [MODIFY] [Profile.tsx](file:///C:/Users/ADITYA PATHADE/Music/HeatWatch/heatwatch-mobile/src/pages/Profile.tsx)
- Connect "Sign Out" to `useAuth`.
- Show more user-relevant information.

## Verification Plan

### Automated Tests
- Run `npm run build` to ensure no TypeScript or build errors.

### Manual Verification
- Test the full onboarding flow on first launch.
- Verify that permissions are requested correctly.
- Verify that "Sign Out" returns the user to the onboarding screen.
- Check all screens for responsive layout on different simulated device sizes.
- Verify that API data loads correctly and displays in the new UI components.
