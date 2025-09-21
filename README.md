# Employee Management System

A simple web app to manage employees, using a FastAPI backend and React frontend. The backend connects to an online MongoDB Atlas database.

## Prerequisites
- Python 3.10+
- Node.js & npm

## Backend Setup
1. Open a terminal in the `backend` folder.
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Run the backend server:
   ```
   python main.py
   ```
   or (if using Uvicorn):
   ```
   uvicorn main:app --reload
   ```

## Frontend Setup
1. Open a terminal in the `frontend` folder.
2. Install dependencies:
   ```
   npm install
   ```
3. Start the frontend:
   ```
   npm start
   ```

## Docker Setup (Recommended for VM)
1. Ensure Docker is installed and running on your VM.
2. Copy the entire project folder to your VM.
3. In the project root, build and start containers:
   ```
   docker-compose up --build
   ```
4. This will start two containers:
   - Backend API on port 8000
   - Frontend React app on port 3000 (proxied via nginx)
5. Access the app at [http://localhost:3000](http://localhost:3000)

## Notes
- The backend uses MongoDB Atlas; no local MongoDB container is included.
- Make sure your VM has internet access to connect to MongoDB Atlas.
- To stop containers, run:
   ```
   docker-compose down
   ```
- For development, you can modify code and rebuild containers as needed.
