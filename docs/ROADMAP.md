# 4-Week Development Roadmap

## Week 1: Planning + Authentication + UI + Maps
**Focus:** Project setup, core user flows, and mapping foundation.
- **Team-wide:** Finalize project documentation, folder structure, and tech stack. Set up GitHub repo and initial boilerplate for all services.
- **Backend & DB (Members 1 & 6):** Set up Node.js/Express boilerplate, configure MongoDB Atlas, design User schema, and implement JWT Registration/Login APIs.
- **Frontend (Member 2):** Initialize React Native Expo app, build Login/Registration screens, and set up basic app navigation.
- **Maps (Member 3):** Integrate Google Maps API, build the Map Screen, and implement GPS location fetching and basic polygon drawing.
- **AI & Weather (Members 4 & 5):** Research and gather agricultural datasets; obtain Weather API keys and review API documentation.

## Week 2: Backend APIs + Weather + Database
**Focus:** Data collection forms, external API integration, and database schemas.
- **Backend & DB (Members 1 & 6):** Develop APIs for saving farm data (location, crop details). Design Farm and CropData schemas. Set up input validation.
- **Frontend (Member 2):** Build the data entry forms for Crop Type, Soil Type, Fertilizer, etc. Link frontend auth with backend.
- **Maps (Member 3):** Finalize polygon area calculation and prepare GeoJSON payload to send to the backend.
- **Weather (Member 5):** Implement Weather API integration in the backend to fetch localized weather data based on farm coordinates.
- **AI (Member 4):** Perform Data Preprocessing and Feature Engineering on the gathered datasets. Start training initial baseline ML models.

## Week 3: AI Model + Recommendations + Integration
**Focus:** AI service deployment, recommendation logic, and system integration.
- **AI (Member 4):** Finalize XGBoost/Random Forest models for Yield, Fertilizer, and Irrigation prediction. Wrap models in FastAPI and expose `/predict` endpoint.
- **Weather (Member 5):** Develop rule-based recommendation logic combining weather forecasts with AI outputs.
- **Backend (Member 1):** Integrate the Node.js server with the Python FastAPI service. Orchestrate the flow: receive farm data -> fetch weather -> call AI -> return combined response.
- **Frontend & Maps (Members 2 & 3):** Develop the personalized Dashboard UI to display the AI predictions, weather data, and map summary visually.

## Week 4: Testing + Bug Fixes + Deployment + Documentation
**Focus:** Quality assurance, system stability, and final presentation.
- **Testing (Member 6):** Set up CI/CD workflows. Lead end-to-end testing of the complete flow. Conduct API and UI testing.
- **Frontend & Maps (Members 2 & 3):** Fix UI bugs, ensure responsive design, and polish the user experience on the dashboard.
- **Backend, AI & Weather (Members 1, 4, 5):** Fix data flow bugs, optimize API response times, and handle error edge cases.
- **Team-wide:** Deploy Backend and AI services to Render/Railway. Ensure MongoDB Atlas is secure. Finalize all project documentation, Postman collections, and prepare the project presentation.
