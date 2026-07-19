# 🌾 AgriYield - AI-Powered Smart Farming Platform

AgriYield is a comprehensive, production-ready Full-Stack Agritech mobile application designed to empower farmers with data-driven insights. By leveraging Artificial Intelligence, real-time weather data, and market trends, AgriYield helps farmers maximize their crop production, optimize resource usage, and make informed agricultural decisions.

The application is completely bilingual (English & Hindi), ensuring accessibility for a wider demographic of farmers.

---

## 🚀 Key Features

- **🧠 Advanced AI Yield Prediction**: Uses a trained Machine Learning model (XGBoost) to predict crop yields based on 14 environmental and soil parameters.
- **🌍 Bilingual Interface**: Full support for English and Hindi. The app dynamically switches languages on the fly using `react-i18next`.
- **🌦️ Automated Weather Integration**: Fetches real-time Temperature, Humidity, and Rainfall data for the user's specific geographic location using the **OpenWeather API**.
- **📈 Live Market Prices**: Integrates with the **OGD (Open Government Data) API** to fetch real-time agricultural commodity prices.
- **📍 Location Services**: Automatically detects the farmer's location via GPS to provide hyper-localized weather and predictions.
- **🔒 Secure Authentication**: Robust user account system with encrypted passwords and JWT-based session management.
- **📊 Prediction History**: Automatically saves past predictions to a cloud database so farmers can track their yield estimates over time.
- **🎨 Glassmorphic UI**: Features a beautiful, modern, highly responsive, and accessible user interface built specifically for mobile devices.

---

## 🏗️ Architecture & Tech Stack

AgriYield uses a modern microservices architecture, separating the client, business logic, and heavy AI computation into distinct environments.

### 📱 Frontend (Mobile App)
- **Framework**: React Native & Expo
- **Language**: JavaScript / ES6
- **Routing**: React Navigation (Stack & Tab Navigators)
- **State Management & Requests**: Axios
- **Localization**: `react-i18next`

### ⚙️ Backend (REST API)
- **Runtime**: Node.js & Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Security**: JWT (JSON Web Tokens) Authentication, bcrypt for password hashing
- **Deployment**: Render

### 🧠 AI Microservice
- **Framework**: Python & FastAPI
- **Machine Learning**: `scikit-learn`, `xgboost`, `pandas`
- **Model**: Pre-trained XGBoost Regressor optimized for agricultural datasets.
- **Deployment**: Render

---

## 🧪 How the AI Works

The prediction engine is completely decoupled from the Node.js backend. When a farmer requests a prediction, the Node.js server forwards the data to the Python FastAPI microservice.

The XGBoost model takes in **14 specific parameters** to generate an accurate yield prediction (in tons per hectare):
1. **Crop Type** (Encoded)
2. **Year**
3. **Season** (Kharif, Rabi, etc.)
4. **State/Region**
5. **Temperature** (°C - Auto-fetched via GPS)
6. **Rainfall** (mm - Auto-fetched via GPS)
7. **Humidity** (% - Auto-fetched via GPS)
8. **Nitrogen (N)**
9. **Phosphorus (P)**
10. **Potassium (K)**
11. **pH Level**
12. **Fertilizer Usage**
13. **Pesticide Usage**
14. **Area** (Hectares)

---

## 🛠️ Local Development Setup

To run this project locally, you will need Node.js, Python 3.10+, and MongoDB installed.

### 1. Clone the Repository
```bash
git clone https://github.com/Vasu3759/AI_Smart_Farm.git
cd AI_Smart_Farm
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
AI_SERVICE_URL=http://localhost:8000
OPENWEATHER_API_KEY=your_openweather_key
OGD_API_KEY=your_ogd_key
```
Run the backend:
```bash
npm run dev
```

### 3. AI Service Setup
```bash
cd ai-service
pip install -r requirements.txt
```
Run the FastAPI server:
```bash
uvicorn api:app --reload --port 8000
```

### 4. Frontend Setup
```bash
cd frontend
npm install
```
Update `src/config.js` to point to your local machine's IP address (e.g., `http://192.168.1.x:5000`).
Run the app:
```bash
npx expo start
```
Scan the QR code with the Expo Go app on your phone.

---

## 🌐 Production Deployment

AgriYield is fully deployed and accessible globally.

- **Cloud Hosting**: Both the Node.js Backend and the Python AI Service are hosted securely on [Render](https://render.com).
- **CI/CD Pipeline**: The repository utilizes **GitHub Actions**. Every time code is pushed to the `main` branch, GitHub Actions automatically builds a native Android APK (`app-release.apk`) using Expo's local build tools, completely bypassing the need for a premium EAS subscription.
- **Artifacts**: You can download the latest production-ready Android APK directly from the "Actions" tab in this repository.

---

## 🔐 Security Notice

**No API keys or database credentials are included in this repository.**
All sensitive information is securely handled using environment variables (`.env`). If you fork this project, you must provide your own API keys for MongoDB, OpenWeather, and OGD India.
