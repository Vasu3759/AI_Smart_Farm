# Project Folder Structure

The repository will use a monorepo-style structure to keep all project components in one centralized repository.

```text
smart-farming/
│
├── frontend/             # React Native Expo application
│   ├── assets/           # Images, fonts, icons
│   ├── src/
│   │   ├── components/   # Reusable UI components (Buttons, Cards)
│   │   ├── screens/      # Main application screens (Login, Home, Map, Dashboard)
│   │   ├── navigation/   # React Navigation configuration
│   │   ├── services/     # API call wrappers (Axios)
│   │   ├── utils/        # Helper functions
│   │   └── context/      # React Context for state management
│   ├── App.js            # Main entry point for the frontend app
│   └── package.json      # Frontend dependencies
│
├── backend/              # Node.js and Express server
│   ├── src/
│   │   ├── controllers/  # Logic for handling API requests
│   │   ├── routes/       # API route definitions
│   │   ├── models/       # Mongoose database schemas
│   │   ├── middlewares/  # Custom middleware (JWT auth, error handling)
│   │   ├── services/     # External integrations (Weather API)
│   │   └── config/       # Environment and DB config files
│   ├── app.js            # Express app setup
│   └── package.json      # Backend dependencies
│
├── ai-service/           # Python FastAPI application
│   ├── main.py           # FastAPI server entry point
│   ├── models/           # Exported ML model files (.pkl or .joblib)
│   ├── routers/          # FastAPI route definitions
│   ├── scripts/          # Training scripts and data processing logic
│   └── requirements.txt  # Python dependencies
│
├── docs/                 # Project documentation
│   ├── TEAM_ROLES.md     # Details of team member responsibilities
│   ├── ROADMAP.md        # 4-week development timeline
│   ├── TASK_BOARD.md     # Markdown-based task tracking
│   └── FOLDER_STRUCTURE.md # This file
│
├── datasets/             # Data files used for ML model training
│   ├── raw/              # Unprocessed datasets
│   └── processed/        # Cleaned datasets ready for training
│
├── postman/              # API Testing Collections
│   └── SmartFarming.postman_collection.json # Exported Postman collection for backend testing
│
├── architecture/         # System design diagrams
│   └── system_diagram.png # Architecture visualization
│
├── docker/               # Containerization configs (optional for local dev)
│   ├── docker-compose.yml # Orchestration for DB, Backend, and AI Service
│   └── Dockerfile        # Dockerfiles for individual services
│
└── README.md             # Main project documentation and overview
```

### Explanation of Folders

- **frontend/**: Contains all mobile application code, screens, and UI logic developed with React Native and Expo.
- **backend/**: Contains the core Node.js server handling authentication, database connections, and business logic routing.
- **ai-service/**: An isolated Python environment for serving machine learning models efficiently via FastAPI.
- **docs/**: Centralized location for all project planning, roles, structural documents, and roadmap.
- **datasets/**: Stores the CSVs or JSONs used to train the agricultural AI models.
- **postman/**: Shared Postman collections so the whole team can test backend APIs easily and uniformly.
- **architecture/**: Visual aids and diagrams explaining the system flow and database schema relationships.
- **docker/**: Configurations for containerizing the application to ensure consistent deployments across environments.
