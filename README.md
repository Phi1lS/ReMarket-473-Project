# ReMarket - A Social Marketplace App

ReMarket is a modern, interactive social marketplace application designed for web and mobile platforms. Users can explore items for sale, view recommendations, and connect with friends, all while enjoying a seamless and visually appealing interface.

[Web App](https://remarket-a69bd.web.app)
[Expo Go App](exp://u.expo.dev/80c43a8d-5c6a-4fa7-baad-25e789fc3459/group/52961bf1-03ab-4a5c-b0b7-d2943338ac3e)

Last updated: 11.26.2024

## Features

- **Browse and Search:** Explore items listed by sellers, filter by categories, and search for specific items.
- **Recommendations:** View personalized item recommendations based on your purchase history and your friends' activity.
- **Friend Connections:** Connect with friends to see what they’re interested in and discover items through their activity.
- **Pagination:** Smooth navigation with paginated item listings for an optimized user experience.
- **Responsive Design:** Fully functional on mobile and web platforms, with clean and adaptive layouts.
- **Firebase Integration:** Real-time data synchronization using Firebase for storage, authentication, and hosting.

## Technologies Used

- **Frontend Framework:** [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Icons:** [Ionicons](https://ionicons.com/) via `@expo/vector-icons`
- **Backend:** Firebase (Firestore, Authentication, and Hosting)
- **Styling:** React Native Stylesheets
- **Font Loading:** Expo Font Loader
- **Package Manager:** npm

## Installation and Setup

### Prerequisites

- Node.js installed on your system ([Download Node.js](https://nodejs.org/))
- Expo CLI globally installed
- Firebase project set up ([Firebase Console](https://console.firebase.google.com/))

### Steps

1. Clone the repository:
   git clone https://github.com/Phi1lS/ReMarket-473-Project
   cd remarket

2. Install dependencies:
    npm install

3. Set up Firebase:
	•	Create a Firebase project in the Firebase Console.
	•	Add your firebaseConfig in firebaseConfig.js:
    
    `export const firebaseConfig = {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_PROJECT_ID.appspot.com",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID",
    };`

4. Start the development server:
    npx expo start

5. Open the app:
    •	For mobile: Scan the QR code using the Expo Go app.
	•	For web: Open the URL displayed in the terminal.

### Contributors
- **Phillip Solis** - [GitHub](https://github.com/Phi1lS) [Website](https://phillipsolis.com)
- **Nathan Halash** - [GitHub](https://github.com/nhalash)
- **Tom VandenBulck** - [GitHub](https://github.com/tvanden3)