# Caveo Backend - Terraform Infrastructure

This Terraform configuration sets up the AWS infrastructure for the Caveo Backend API staging environment.

## Architecture Overview

The infrastructure includes:
- **EC2 Instance**: t3.small instance running Ubuntu 22.04 LTS for the staging environment
- **Security Group**: Configured for HTTP (80), HTTPS (443), SSH (22), and API port (3000) access
- **Elastic IP**: Static IP address for consistent access
- **IAM Role**: EC2 role with permissions for CloudWatch, Systems Manager, and ECR
- **CloudWatch**: Log group for application and system logs
- **Cognito**: User pool and client for JWT authentication

## Prerequisites

1. **AWS CLI configured** with appropriate credentials
2. **Terraform installed** (version >= 1.0)
3. **AWS Key Pair created** for EC2 access

### Creating AWS Key Pair

```bash
# Create a new key pair (replace 'caveo-key-pair' with your preferred name)
aws ec2 create-key-pair \
  --key-name caveo-key-pair \
  --query 'KeyMaterial' \
  --output text > ~/.ssh/caveo-key-pair.pem

# Set correct permissions
chmod 600 ~/.ssh/caveo-key-pair.pem
```

## Configuration

1. Copy the example terraform.tfvars file:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Edit `terraform.tfvars` with your values:
   ```hcl
   aws_region  = "us-east-1"
   app_name    = "caveo-backend"
   environment = "staging"
   key_name    = "caveo-key-pair"  # Your actual key pair name

   cognito_callback_urls = ["https://your-domain.com/callback"]
   cognito_logout_urls   = ["https://your-domain.com/logout"]
   ```

## Deployment

### Initialize and Deploy

```bash
# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply the configuration
terraform apply
```

### Get Important Information

After deployment, get the connection details:

```bash
# Get all outputs
terraform output

# Get specific values
terraform output staging_public_ip
terraform output ssh_connection_command
terraform output api_endpoints
terraform output cognito_client_id
terraform output -raw cognito_client_secret  # Sensitive value
```

## Accessing the Server

### SSH Access
```bash
# Use the output command or manually:
ssh -i ~/.ssh/caveo-key-pair.pem ubuntu@<PUBLIC_IP>
```

### Server Setup

Once connected to the server, you'll find:

- **Application directory**: `/opt/caveo-backend/`
- **Deployment script**: `/opt/caveo-backend/deploy.sh`
- **Status check script**: `/opt/caveo-backend/status.sh`
- **Environment template**: `/opt/caveo-backend/.env.staging.template`

### Deploy Your Application

1. **Clone your repository**:
   ```bash
   cd /opt/caveo-backend
   git clone https://github.com/your-username/caveo-challenge.git .
   ```

2. **Create environment file**:
   ```bash
   # Copy the template
   cp .env.staging.template .env

   # Edit with actual values (get these from terraform outputs)
   vim .env
   ```

3. **Deploy the application**:
   ```bash
   # Run the deployment script
   ./deploy.sh
   ```

### Environment Variables

Your `.env` file should include (get values from `terraform output`):

```bash
# Application Configuration
NODE_ENV=production
HOST=0.0.0.0
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=caveo
DB_PASSWORD=your_secure_password
DB_NAME=caveo

# JWT Configuration (from terraform outputs)
JWT_EXPECTED_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX
AWS_REGION=us-east-1
AWS_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
AWS_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxx
AWS_COGNITO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxx
AWS_COGNITO_JWKS_URI=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX/.well-known/jwks.json
```

## API Access

After deployment, your API will be available at:

- **Health Check**: `http://<PUBLIC_IP>/v1/health`
- **API Documentation**: `http://<PUBLIC_IP>/docs`
- **API Base URL**: `http://<PUBLIC_IP>/v1`

## Monitoring

### CloudWatch Logs
- Application logs: `/aws/ec2/caveo-backend/staging`
- System logs are automatically collected

### Server Status
```bash
# SSH into the server and run:
cd /opt/caveo-backend
./status.sh
```

## Security Features

- **Encrypted EBS volumes**
- **Security group restricting access to necessary ports only**
- **IAM roles with minimal required permissions**
- **Systems Manager access for secure management**
- **CloudWatch monitoring and logging**

## Nginx Reverse Proxy

The server includes Nginx as a reverse proxy configured to:
- Handle HTTP traffic on port 80
- Proxy API requests to your Node.js application on port 3000
- Serve health checks and API documentation
- Ready for SSL/TLS termination with Let's Encrypt

## Cleanup

To destroy the infrastructure:

```bash
terraform destroy
```

**Note**: This will delete all resources including the EC2 instance and data. Make sure to backup any important data first.

## Troubleshooting

### Common Issues

1. **SSH Connection Issues**:
   - Verify key pair name matches `var.key_name`
   - Check key permissions: `chmod 600 ~/.ssh/your-key.pem`
   - Ensure security group allows SSH from your IP

2. **Application Not Starting**:
   - Check Docker status: `systemctl status docker`
   - View application logs: `docker-compose logs`
   - Check environment variables in `.env` file

3. **Port Access Issues**:
   - Verify security group rules in AWS console
   - Check if Nginx is running: `systemctl status nginx`
   - Test local connectivity: `curl localhost:3000/v1/health`

### Helpful Commands

```bash
# On the server
sudo docker ps                    # Check running containers
sudo docker-compose logs         # View application logs
sudo systemctl status nginx      # Check nginx status
sudo journalctl -u caveo-backend  # View systemd service logs (if used)
tail -f /var/log/caveo-backend/*.log  # View application logs
```

## Next Steps

1. **Set up SSL/TLS** with Let's Encrypt for HTTPS
2. **Configure DNS** to point to your Elastic IP
3. **Set up automated deployments** with GitHub Actions
4. **Configure database backups**
5. **Set up monitoring alerts** in CloudWatch
