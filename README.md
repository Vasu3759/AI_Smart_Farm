# AI-Powered Smart Farming Platform

## 1. Project Title
AI-Powered Smart Farming Platform

## 2. Project Overview
The AI-Powered Smart Farming Platform is a comprehensive mobile and web application designed to empower farmers with data-driven decision-making. By combining user inputs with real-time weather data and advanced machine learning models, the platform provides tailored recommendations for crop yield prediction, optimal fertilizer usage, irrigation scheduling, and pesticide application.

## 3. Problem Statement
Traditional farming often relies on guesswork and historical practices, leading to resource wastage (water, fertilizer, pesticides) and suboptimal crop yields. Farmers lack accessible, real-time, and localized insights to adapt to changing environmental conditions and soil profiles, reducing overall productivity and sustainability.

## 4. Objectives
- To optimize farming resources (water, fertilizers, pesticides) through AI-driven recommendations.
- To improve crop yield predictions using localized weather and soil data.
- To provide an intuitive and accessible platform for farmers to manage their field data.
- To promote sustainable and smart farming practices.

## 5. Features
- **User Authentication**: Secure login and registration.
- **Interactive Farm Mapping**: Draw and calculate farm boundaries using GPS and Google Maps.
- **Automated Weather Integration**: Fetch real-time and forecasted weather data based on farm coordinates.
- **AI Predictions & Recommendations**: Get expected crop yield, fertilizer amounts, irrigation schedules, and pesticide recommendations.
- **Personalized Dashboard**: Visual representation of farm health, weather, and AI insights.

## 6. Complete Workflow
1. Farmer registers and logs into the application.
2. The application asks for location permission.
3. The farmer marks the farm boundary on an interactive map.
4. The farmer enters farming information such as Crop Type, Seed Variety, Soil Type, Fertilizer Used, Irrigation Method, and Sowing Date.
5. The backend automatically fetches weather information using the GPS coordinates.
6. The collected data is sent to an AI model.
7. The AI predicts Expected Crop Yield, Fertilizer Recommendation, Irrigation Schedule, and Pesticide Recommendation.
8. The results are displayed on a personalized dashboard.

## 7. System Architecture
- **Client (Frontend)**: React Native app running on the user's device, handling UI and GPS map interactions.
- **API Gateway (Backend)**: Node.js/Express.js server handling authentication, business logic, and API orchestration.
- **Third-Party APIs**: Google Maps API for mapping and OpenWeather API for weather data.
- **AI Service**: Python FastAPI service running machine learning inference using trained models.
- **Database**: MongoDB Atlas for storing user profiles, farm data, and historical predictions.

## 8. Tech Stack
- **Frontend**: React Native (Expo)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT
- **Maps**: Google Maps API, React Native Maps
- **Weather**: OpenWeather API (or WeatherAPI)
- **AI Service**: Python, FastAPI, Scikit-learn, Pandas, NumPy, XGBoost or Random Forest
- **Version Control**: Git, GitHub
- **Deployment**: Render / Railway (Backend & AI), MongoDB Atlas (Database)

## 9. Folder Structure (Planned)
See `docs/FOLDER_STRUCTURE.md` for a complete breakdown. 
- `/frontend`: React Native Expo application.
- `/backend`: Node.js Express server.
- `/ai-service`: Python FastAPI application and ML models.
- `/docs`: Project documentation and API specifications.
- `/datasets`: Data used for training the AI models.

## 10. API Overview (Planned)
- `POST /api/auth/register`: Register a new farmer.
- `POST /api/auth/login`: Authenticate and return JWT.
- `POST /api/farm`: Save farm boundaries and details.
- `GET /api/weather/:lat/:lng`: Fetch weather data.
- `POST /api/ai/predict`: Trigger AI model predictions.
- `GET /api/dashboard/:userId`: Fetch dashboard summary data.

## 11. Database Collections
- **Users**: User credentials, profile info.
- **Farms**: Boundary coordinates, area, associated user.
- **CropData**: Crop type, soil type, sowing date, inputs.
- **Predictions**: Historical AI recommendations and yields.

## 12. AI Pipeline
1. **Data Collection**: Historical agriculture datasets combining soil, crop, and weather data.
2. **Preprocessing**: Handle missing values, normalize features, encode categorical variables.
3. **Training**: Train models (XGBoost/Random Forest) for yield prediction and multi-output recommendations.
4. **Serving**: Export models (e.g., joblib/pickle) and expose via FastAPI `/predict` endpoint.

## 13. Future Scope
- Integration with IoT sensors (soil moisture, temperature) for real-time field data.
- Drone imagery analysis for pest detection.
- Marketplace for buying/selling farming equipment and crops.
- Multi-language support for regional accessibility.

## 14. Installation Plan
1. Clone the repository.
2. Setup MongoDB Atlas and obtain the connection string.
3. Obtain API keys for Google Maps and OpenWeather.
4. Backend: `cd backend && npm install && npm run dev`
5. AI Service: `cd ai-service && pip install -r requirements.txt && uvicorn main:app --reload`
6. Frontend: `cd frontend && npm install && npx expo start`

## 15. Development Timeline
See `docs/ROADMAP.md` for a complete week-by-week breakdown.

## 16. Contribution Guidelines
- Fork the repository and create a new branch for your feature.
- Ensure all code is tested and follows the coding standards.
- Submit a Pull Request (PR) with a clear description of the changes.
- Require at least one peer review before merging into `develop`.

## 17. Coding Standards
- Use Prettier and ESLint for JavaScript/TypeScript code formatting.
- Follow PEP 8 guidelines for Python code.
- Use descriptive variable and function names.
- Comment complex logic and maintain updated READMEs in subdirectories.

## 18. Git Branch Strategy
- `main`: Production-ready code.
- `develop`: Integration branch for ongoing development.
- `feature/<feature-name>`: Branches for new features (branched off `develop`).
- `bugfix/<bug-name>`: Branches for bug fixes.

## 19. Commit Message Convention
- `feat: [description]` for new features.
- `fix: [description]` for bug fixes.
- `docs: [description]` for documentation updates.
- `chore: [description]` for routine tasks (e.g., dependency updates).

## 20. Team Structure
See `docs/TEAM_ROLES.md` for complete responsibilities.
- **Member 1**: Project Lead + Backend Lead
- **Member 2**: React Native Frontend Developer
- **Member 3**: Maps & Location Developer
- **Member 4**: AI/ML Engineer
- **Member 5**: Weather API & Recommendation Engine
- **Member 6**: Database, Testing & DevOps
