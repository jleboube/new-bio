# Readme


## Project Structure

```
├── app
│   ├── database.js
│   ├── node_modules
│   ├── package.json
│   ├── public
│   │   ├── app.js
│   │   ├── index.html
│   │   ├── styles.css
│   ├── server.js
├── docker-compose.yaml
├── Dockerfile
└── Readme.md
```

## How to Deploy:
Make sure Docker and Docker Compose are installed on your system
Place all files in the directory structure as shown above
Run the following command from the root directory:

'docker-compose -f docker-compose.prod.yaml build'
'docker-compose -f docker-compose.prod.yaml up -d'

Access the application at http://localhost:3000


## Features of This Docker Setup
Easy Deployment: Just one command to bring up the entire stack
Data Persistence: PostgreSQL data is stored in a named volume
Environment Variables: Database connection parameters are passed via environment variables
Container Restart Policy: Containers will restart automatically if they crash
Development Friendly: Code changes are reflected without rebuilding the container (due to volume mounting)
Isolated Networking: The services communicate via Docker's internal network
Simple Scaling: Ready for scaling with orchestration tools like Docker Swarm or Kubernetes

### This Docker Compose setup will create two containers:

A Node.js container running the web application
A PostgreSQL container for the database
The data will persist even if you restart the containers, thanks to the volume configuration. If you need to make changes to the application, you can simply update the code and restart the containers with docker-compose restart.
