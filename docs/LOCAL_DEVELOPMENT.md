# 🐳 Local Development with Docker

This guide will help you run the Caveo Backend API locally using Docker with proper AWS integration and security best practices.

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ **Docker & Docker Compose** installed
- ✅ **AWS CLI** configured with your credentials
- ✅ **Git** for cloning the repository

## 🚀 Quick Start

### 1. **Clone and Navigate**
```bash
git clone <repository-url>
cd caveo-challenge/server
```

### 2. **Configure AWS Credentials**

#### Option A: AWS CLI Profile (Recommended)
```bash
# Configure your AWS credentials
aws configure --profile caveo-dev
# Enter your AWS Access Key ID, Secret Access Key, and region

# Verify configuration
aws configure list --profile caveo-dev
```

#### Option B: Default AWS Profile
```bash
# Use default AWS profile
aws configure
# Enter your credentials

# Verify
aws sts get-caller-identity
```

### 3. **Setup Environment Variables**
```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your settings
nano .env  # or use your preferred editor
```

### 4. **Configure Environment File**

Update your `.env` file with the following **required** configurations:

```bash
# Application Configuration
NODE_ENV=development
HOST=0.0.0.0
PORT=3000

# Database Configuration (PostgreSQL) - Use container service name
DB_HOST=postgres
DB_PORT=5432
DB_USER=caveo
DB_PASSWORD=caveo
DB_NAME=caveo

# AWS Cognito Configuration
# Note: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are handled by mounted AWS credentials
AWS_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
AWS_COGNITO_CLIENT_ID=your_client_id
AWS_COGNITO_CLIENT_SECRET=your_client_secret
AWS_COGNITO_JWKS_URI=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_xxxxxxxxx/.well-known/jwks.json
AWS_REGION=us-east-1

# JWT/Auth Configuration
JWT_EXPECTED_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_xxxxxxxxx

# Logging Configuration
LOG_LEVEL=info
APP_NAME=caveo-api
LOG_ENVIRONMENT=development
```

### 5. **Start the Development Environment**
```bash
# Start all services in detached mode
docker compose -f docker-compose-dev.yml up -d

# Or start with logs visible
docker compose -f docker-compose-dev.yml up
```

### 6. **Verify Everything is Working**
```bash
# Wait for services to be ready (about 10-15 seconds)
sleep 15

# Check health endpoint
curl http://localhost:3000/v1/health

# Expected response:
# {"status":"UP","uptime":X,"timestamp":"...","database":{"status":"UP"}}
```

## 🧪 Testing the API

### **Test User Registration**
```bash
curl -X POST http://localhost:3000/v1/auth \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }'
```

### **Test User Sign-in**
```bash
curl -X POST http://localhost:3000/v1/auth \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPassword123!"
  }'
```

## 🔧 Development Commands

### **View Logs**
```bash
# All services
docker compose -f docker-compose-dev.yml logs -f

# Specific service
docker compose -f docker-compose-dev.yml logs -f caveo-dev
docker compose -f docker-compose-dev.yml logs -f postgres
```

### **Restart Services**
```bash
# Restart all
docker compose -f docker-compose-dev.yml restart

# Restart specific service
docker compose -f docker-compose-dev.yml restart caveo-dev
```

### **Stop Services**
```bash
# Stop all services
docker compose -f docker-compose-dev.yml down

# Stop and remove volumes (clean slate)
docker compose -f docker-compose-dev.yml down -v
```

### **Rebuild Application**
```bash
# Rebuild and restart
docker compose -f docker-compose-dev.yml up -d --build
```

## 🛠️ Architecture Overview

### **Services**
- **`postgres`**: PostgreSQL database (Bitnami image)
- **`caveo-dev`**:  Node.js API application

### **Networking**
- **Database**: Accessible via service name `postgres` within Docker network
- **API**: Exposed on `localhost:3000` on your host machine
- **Database Port**: Exposed on `localhost:5432` for debugging (optional)

### **AWS Credentials**
- **Local Development**: Uses mounted AWS credentials from `~/.aws/`
- **No hardcoded credentials** in environment variables
- **AWS SDK automatically discovers** credentials from mounted volume

## 🔒 Security Features

- ✅ **No AWS credentials in code or config files**
- ✅ **Read-only mount** of AWS credentials
- ✅ **Environment-based configuration**
- ✅ **Automatic credential discovery** by AWS SDK
- ✅ **Database isolation** within Docker network

## 🐛 Troubleshooting

### **Common Issues & Solutions**

#### 1. **AWS Credentials Error**
```bash
# Error: Unable to locate credentials
# Solution: Verify AWS CLI configuration
aws configure list
aws sts get-caller-identity
```

#### 2. **Database Connection Error**
```bash
# Error: ECONNREFUSED ::1:5432 or 127.0.0.1:5432
# Solution: Ensure DB_HOST=postgres in .env file
grep DB_HOST .env
# Should show: DB_HOST=postgres
```

#### 3. **Port Already in Use**
```bash
# Error: Port 3000 or 5432 already in use
# Solution: Stop conflicting services or change ports
sudo lsof -i :3000
sudo lsof -i :5432

# Or change ports in .env:
# PORT=3001
# DB_PORT=5433
```

#### 4. **Permission Errors with AWS Credentials**
```bash
# Error: Permission denied accessing ~/.aws
# Solution: Check AWS directory permissions
ls -la ~/.aws/
chmod 600 ~/.aws/credentials
chmod 644 ~/.aws/config
```

#### 5. **Service Won't Start**
```bash
# Check service status
docker compose -f docker-compose-dev.yml ps

# View detailed logs
docker compose -f docker-compose-dev.yml logs caveo-dev

# Rebuild if needed
docker compose -f docker-compose-dev.yml up -d --build
```

### **Health Checks**
```bash
# Application health
curl http://localhost:3000/v1/health

# Database health (from within container)
docker compose -f docker-compose-dev.yml exec postgres pg_isready -U caveo -d caveo

# Container status
docker compose -f docker-compose-dev.yml ps
```

## 📊 Development Workflow

### **Typical Development Session**
1. **Start services**: `docker compose -f docker-compose-dev.yml up -d`
2. **View logs**: `docker compose -f docker-compose-dev.yml logs -f caveo-dev`
3. **Make code changes** (automatically reloaded via volume mount)
4. **Test endpoints** using curl or your API client
5. **Stop services**: `docker compose -f docker-compose-dev.yml down`

### **File Watching**
- Code changes are **automatically detected** and the app restarts
- Uses `tsx watch` for fast TypeScript compilation
- Volume mount ensures changes sync immediately
