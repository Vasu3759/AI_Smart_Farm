# Team Roles and Responsibilities

This document outlines the specific roles and responsibilities for the 6 team members building the AI-Powered Smart Farming Platform.

---

## Member 1: Project Lead + Backend Lead

**Responsibilities:**
- Project setup and architecture planning.
- Setting up the Express server and routing.
- Implementing User Authentication (JWT).
- MongoDB connection and core database operations.
- API integration and acting as a bridge between frontend and AI service.
- GitHub repository management and code reviews.
- Final deployment of the backend.

**Technologies:** Node.js, Express.js, JWT, MongoDB, Git/GitHub.

**Expected Deliverables:** Functional authentication APIs, central backend gateway, deployed server.

**Estimated Number of Files:** 15-20 (Controllers, Routes, Middleware, Server setup).

**Dependencies on Other Members:**
- Needs Database schemas from Member 6.
- Needs AI prediction endpoints from Member 4 to integrate into backend workflows.

**Daily Tasks:** Review PRs, develop core API endpoints, resolve blockers.

**Milestones:** Auth system complete, Backend gateway complete, Production deployment.

**Testing Responsibilities:** Unit testing backend routes, Integration testing for auth.

**Pull Request Responsibilities:** Final reviewer for all PRs targeting `develop` and `main`.

---

## Member 2: React Native Frontend Developer

**Responsibilities:**
- Initializing the React Native (Expo) project.
- Developing Login and Registration screens.
- Designing the Home Screen and main Dashboard UI.
- Setting up App Navigation.
- Building input forms for farm data.
- Ensuring Responsive Design across various mobile devices.

**Technologies:** React Native, Expo, React Navigation, Axios/Fetch.

**Expected Deliverables:** Complete frontend application UI, integrated with backend auth.

**Estimated Number of Files:** 20-30 (Screens, Components, Navigation config, Styles).

**Dependencies on Other Members:**
- Needs Backend APIs from Member 1.
- Needs Map component from Member 3.

**Daily Tasks:** Build UI components, integrate APIs, fix layout issues.

**Milestones:** Auth screens done, Forms completed, Dashboard visually complete.

**Testing Responsibilities:** UI/UX testing, component snapshot tests.

**Pull Request Responsibilities:** Reviewing frontend-related PRs (e.g., Maps integration).

---

## Member 3: Maps & Location Developer

**Responsibilities:**
- Integrating Google Maps API and React Native Maps.
- Developing the farm boundary drawing feature.
- Handling GeoJSON data structures for farm polygons.
- Extracting and processing GPS coordinates.
- Implementing location permission requests.
- Calculating the total area of the drawn boundary.

**Technologies:** React Native Maps, Google Maps API, GeoJSON, React Native Location APIs.

**Expected Deliverables:** A functional map screen where users can draw and save farm boundaries.

**Estimated Number of Files:** 5-10 (Map Screen, Location Utility, Area Calculator).

**Dependencies on Other Members:**
- Integrated into the main React Native app managed by Member 2.

**Daily Tasks:** Refining map interactions, ensuring accurate polygon calculations.

**Milestones:** Map rendering, Boundary drawing successful, Area calculation accurate.

**Testing Responsibilities:** Manual testing of location permissions and drawing on different devices.

**Pull Request Responsibilities:** Creating PRs for map features into the frontend repository.

---

## Member 4: AI/ML Engineer

**Responsibilities:**
- Finding and cleaning agricultural datasets.
- Feature Engineering (soil data, weather, crop types).
- Training the ML models for yield prediction and recommendations (fertilizer, irrigation).
- Wrapping the models in a FastAPI service.

**Technologies:** Python, FastAPI, Scikit-learn, Pandas, NumPy, XGBoost/Random Forest.

**Expected Deliverables:** Trained ML models, functional FastAPI service with `/predict` endpoint.

**Estimated Number of Files:** 10-15 (Jupyter Notebooks, FastAPI app, Model files).

**Dependencies on Other Members:**
- Needs expected input format from Member 1 and Member 5 (weather data).

**Daily Tasks:** Data preprocessing, model tuning, writing API endpoints.

**Milestones:** Dataset cleaned, Model trained with acceptable accuracy, FastAPI service running.

**Testing Responsibilities:** Evaluating model accuracy, load testing FastAPI.

**Pull Request Responsibilities:** Managing the `ai-service` codebase and reviewing AI-related updates.

---

## Member 5: Weather API & Recommendation Engine

**Responsibilities:**
- Integrating OpenWeather API or WeatherAPI.
- Processing incoming weather data (current and forecast).
- Developing rule-based recommendation logic to supplement AI (e.g., "Don't irrigate if rain is expected").
- Designing the weather display section on the dashboard (data prep).
- Integrating weather fetching into the backend API flow.

**Technologies:** Node.js, Axios, OpenWeather API.

**Expected Deliverables:** A robust weather service module within the backend, weather-based alerts.

**Estimated Number of Files:** 5-10 (Weather Service, Recommendation Logic, Route Handlers).

**Dependencies on Other Members:**
- Needs GPS coordinates from Member 3's Map feature.
- Needs to integrate with Member 1's backend flow.

**Daily Tasks:** API integration, handling rate limits, refining recommendation logic.

**Milestones:** Weather data fetched successfully, recommendation logic integrated.

**Testing Responsibilities:** Unit testing weather data parsing, mocking external API calls.

**Pull Request Responsibilities:** Creating PRs for weather services into the backend repository.

---

## Member 6: Database, Testing & DevOps

**Responsibilities:**
- Designing MongoDB schemas (User, Farm, Predictions).
- Implementing data validation using Mongoose.
- Database query optimization.
- Setting up automated testing frameworks (Jest/Mocha).
- Managing CI/CD pipelines (GitHub Actions).
- Project documentation maintenance.
- Setting up bug tracking (e.g., GitHub Issues) and deployments (Render/Railway, MongoDB Atlas).

**Technologies:** MongoDB, Mongoose, Jest, GitHub Actions, Docker, Render/Railway.

**Expected Deliverables:** Robust database schemas, automated testing pipelines, live deployment links.

**Estimated Number of Files:** 10-15 (Models, Test Configs, Workflow YAMLs).

**Dependencies on Other Members:**
- Needs requirements from all members to design schemas and deployment pipelines.

**Daily Tasks:** Managing database migrations, monitoring CI builds, documenting architecture.

**Milestones:** Schemas finalized, CI/CD pipeline green, production deployment successful.

**Testing Responsibilities:** End-to-end testing setup, API testing validation.

**Pull Request Responsibilities:** Reviewing schema changes, ensuring CI passes before merges.
