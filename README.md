# AgriYield - AI-Powered Smart Farming Platform 🌾

AgriYield is a bilingual (English & Hindi) Full-Stack Agritech application designed to help farmers maximize their crop production and efficiently manage their fields using Artificial Intelligence.

## 🚀 Key Features

- **Bilingual Interface**: Full support for English and Hindi, allowing farmers to comfortably use the app in their preferred language. (Dynamically switches via eact-i18next\).
- **AI Yield Prediction**: Machine Learning-powered microservice that predicts crop yield based on field location, soil pH, fertilizer data (N, P, K), and live weather.
- **Automated Weather Integration**: Silently grabs live Temperature, Humidity, and Rainfall data for the farmer's specific field via the **OpenWeather API**.
- **GPS Field Mapping**: Allows farmers to register their fields using hardware GPS directly from their mobile device.
- **Secure Authentication**: Encrypted user accounts, profile management, and notification settings tied directly to a MongoDB database.
- **Glassmorphic UI**: Beautiful, modern, and highly responsive user interface.

## 🛠️ Tech Stack

- **Frontend (Mobile App)**: React Native, Expo, Axios, React Navigation, react-i18next
- **Backend (API)**: Node.js, Express.js, MongoDB (Mongoose), JWT Authentication
- **AI Microservice**: Python, FastAPI, Pandas, scikit-learn
- **Integrations**: OpenWeather API, Expo Location

## 🔐 Security Notice

**No API keys or database credentials are included in this repository.**
All sensitive information is securely handled using environment variables (\.env\). To run this project locally, you must create your own \.env\ files based on the \.env.example\ provided.

## 🌐 Deployment

- **Backend & AI**: Deployed securely on Render.
- **Frontend**: Packaged as an Android APK using Expo Build Services (EAS).
