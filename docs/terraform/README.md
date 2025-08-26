# 🏗️ Infrastructure Documentation - AWS Terraform

> **Production-ready AWS infrastructure for the Caveo Backend API using Infrastructure as Code**

## 📊 Infrastructure Overview

This Terraform configuration provisions a complete AWS infrastructure stack including VPC networking, EC2 compute, RDS database, AWS Cognito authentication, and supporting services.

```mermaid
graph TB
    subgraph "AWS Cloud Infrastructure"
        subgraph "VPC (10.0.0.0/16)"
            subgraph "Public Subnets"
                EC2[EC2 Instance<br/>caveo-backend-staging]
                ALB[Application Load Balancer<br/>(Future Enhancement)]
            end

            subgraph "Private Subnets"
                RDS[(RDS PostgreSQL<br/>caveo-backend-postgres-staging)]
            end

            IGW[Internet Gateway]
            NAT[NAT Gateway]
        end

        subgraph "Authentication Services"
            Cognito[AWS Cognito<br/>User Pool + Client]
            Lambda[Lambda Functions<br/>Pre-signup & Pre-token]
        end

        subgraph "Security"
            IAM[IAM Roles & Policies]
            SG[Security Groups]
        end
    end

    Internet --> IGW
    IGW --> EC2
    IGW --> ALB
    EC2 --> NAT
    NAT --> RDS
    EC2 --> Cognito
    Cognito --> Lambda
    Lambda --> IAM
    EC2 --> SG
    RDS --> SG
```

## 🛠️ Infrastructure Components

### 🌐 **VPC & Networking** (`vpc.tf`)
**Complete network isolation with public/private subnet architecture**

```terraform
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.app_name}-vpc-${var.environment}"
    Environment = var.environment
  }
}
```

**Network Components:**
- ✅ **Custom VPC** - 10.0.0.0/16 CIDR block for network isolation
- ✅ **Public Subnets** - 2 subnets (10.0.1.0/24, 10.0.2.0/24) across AZs for EC2
- ✅ **Private Subnets** - 2 subnets (10.0.3.0/24, 10.0.4.0/24) for RDS database
- ✅ **Internet Gateway** - Public internet access for EC2 instances
- ✅ **NAT Gateway** - Secure outbound internet access for private resources
- ✅ **Route Tables** - Proper routing configuration for public/private subnets

### 💻 **Compute Infrastructure** (`ec2.tf`)
**Scalable EC2 setup with proper IAM roles and security groups**

```terraform
resource "aws_instance" "app_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  key_name      = var.key_pair_name

  vpc_security_group_ids = [aws_security_group.ec2.id]
  subnet_id              = aws_subnet.public[0].id

  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name
  user_data = base64encode(templatefile("${path.module}/user-data.sh", {
    db_host     = aws_db_instance.postgres.endpoint
    db_name     = aws_db_instance.postgres.db_name
    cognito_pool_id = aws_cognito_user_pool.user_pool.id
  }))
}
```

**EC2 Features:**
- ✅ **Ubuntu 22.04 LTS** - Latest stable Ubuntu AMI
- ✅ **Instance Profile** - IAM role for AWS service access
- ✅ **Security Groups** - HTTP(S), SSH, and custom application ports
- ✅ **User Data Script** - Automated application deployment
- ✅ **Elastic IP** - Static public IP address (optional)

### 🗄️ **Database Infrastructure** (`rds.tf`)
**Production-ready PostgreSQL with security and monitoring**

```terraform
resource "aws_db_instance" "postgres" {
  identifier = "${var.app_name}-postgres-${var.environment}"

  engine         = "postgres"
  engine_version = "15.7"
  instance_class = var.db_instance_class

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_encrypted     = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.postgres.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = var.environment != "production"
}
```

**Database Features:**
- ✅ **PostgreSQL 15.7** - Latest stable PostgreSQL version
- ✅ **Storage Encryption** - Data encrypted at rest
- ✅ **Auto-scaling Storage** - Automatic storage expansion (20GB → 100GB)
- ✅ **Automated Backups** - 7-day retention with point-in-time recovery
- ✅ **Maintenance Windows** - Scheduled maintenance during low-traffic periods
- ✅ **Multi-AZ Support** - High availability configuration (production)

### 🔐 **Authentication Services** (`cognito.tf` & `cognito-lambda.tf`)
**Comprehensive user authentication with Lambda triggers**

```terraform
resource "aws_cognito_user_pool" "user_pool" {
  name = "${var.app_name}-user-pool-${var.environment}"

  username_attributes = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_uppercase = true
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
  }

  schema {
    name                = "internalId"
    attribute_data_type = "String"
    mutable            = false
    required           = false
  }

  lambda_config {
    pre_sign_up         = aws_lambda_function.pre_signup.arn
    pre_token_generation = aws_lambda_function.pre_token_generation.arn
  }
}
```

**Cognito Features:**
- ✅ **Email Authentication** - Email as username with verification
- ✅ **Strong Password Policy** - Enforced complexity requirements
- ✅ **Custom Attributes** - Internal user ID mapping
- ✅ **Lambda Triggers** - Automated user processing
- ✅ **User Groups** - Role-based access control (admin/user)
- ✅ **JWT Token Generation** - Secure token-based authentication
- SRP, password, and refresh token auth flows
- Token validity: 12h access/ID tokens, 30d refresh tokens
- Permissions for email, name, and custom attribute access

**User Groups:**
- **admin:** Administrative access (precedence 1)
- **user:** Standard user access (precedence 2)

### 4. Lambda Functions (`cognito-lambda.tf`)
**Pre-Signup Lambda:**
- Auto-confirms new users (bypasses email verification)
- Triggered during user registration

**Pre-Token Generation Lambda V2:**
- Adds `internalId` as custom claim to access tokens
- Enables database user lookup from JWT tokens
- Triggered on every token generation/refresh

### 5. Infrastructure Outputs (`outputs.tf`)
```terraform
# Values exported for application configuration
output "cognito_user_pool_id" { value = aws_cognito_user_pool.main.id }
output "cognito_client_id" { value = aws_cognito_user_pool_client.client.id }
output "cognito_client_secret" { value = aws_cognito_user_pool_client.client.client_secret }
output "cognito_jwks_uri" { value = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.main.id}/.well-known/jwks.json" }
```

## Terraform Deployment Workflow

### Prerequisites
1. **AWS Account** with appropriate permissions
   - [Create AWS Account](https://aws.amazon.com/free/)
   - [AWS IAM Permissions for Cognito](https://docs.aws.amazon.com/cognito/latest/developerguide/security-iam.html)
2. **Terraform installed** (>= 1.0)
   - [Install Terraform](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli)
3. **AWS CLI configured** with credentials
   - [Install AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
   - [Configure AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html)

### Step 1: Setup AWS Credentials
```bash
# Option A: Copy and configure credentials
cp terraform/.env.example terraform/.env
# Edit .env with your AWS credentials
source terraform/.env

# Option B: Use AWS CLI
aws configure
```

### Step 2: Configure Terraform Variables
```bash
# Copy example and customize
cp terraform/terraform.tfvars.example terraform/terraform.tfvars

# Edit terraform.tfvars:
aws_region = "us-east-1"
app_name = "caveo-backend"
environment = "dev"
```

### Step 3: Initialize Terraform
```bash
cd terraform

# Download providers and initialize
terraform init
```

### Step 4: Plan Infrastructure Changes
```bash
# See what will be created/modified
terraform plan

# This will show:
# - Cognito User Pool and Client
# - Lambda functions for triggers
# - IAM roles and permissions
# - User groups (admin/user)
```

### Step 5: Apply Infrastructure
```bash
# Create infrastructure
terraform apply

# Type 'yes' to confirm
# This creates ~8-10 AWS resources
```

### Step 6: Capture Infrastructure Outputs
```bash
# Get configuration values for your application
terraform output

# Example output:
# cognito_client_id = "1abc2d3efghijk4lmnop5qrstuvwxyz"
# cognito_user_pool_id = "us-east-1_A1b2c3D4e"
# cognito_jwks_uri = "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_A1b2c3D4e/.well-known/jwks.json"
```

### Step 7: Configure Application Environment
Use the Terraform outputs to configure your application's environment variables:
```bash
# Update your .env file with Terraform outputs
AWS_COGNITO_USER_POOL_ID="<from terraform output>"
AWS_COGNITO_CLIENT_ID="<from terraform output>"
AWS_COGNITO_CLIENT_SECRET="<from terraform output>"
AWS_COGNITO_JWKS_URI="<from terraform output>"
```

## Infrastructure Management

```bash
# View current state
terraform show

# Format terraform files
terraform fmt

# Validate configuration
terraform validate

# Destroy infrastructure (careful!)
terraform destroy

# Show specific output
terraform output cognito_user_pool_id

# Import existing resource (if needed)
terraform import aws_cognito_user_pool.main us-east-1_XXXXXX
```

## Environment Management

### Development
```bash
# terraform/terraform.tfvars
environment = "dev"
app_name = "caveo-backend"
```

### Production
```bash
# terraform/terraform.tfvars
environment = "prod"
app_name = "caveo-backend"
# Different User Pool will be created
```

## Troubleshooting

### Common Issues
1. **AWS credentials not configured** → Run `aws configure`
2. **Region mismatch** → Ensure consistent region in terraform.tfvars and AWS config
3. **Lambda deployment fails** → Check IAM permissions
4. **JWKS URI changes** → Re-run `terraform apply` to get updated outputs

### Verification Steps
```bash
# 1. Check Cognito User Pool exists
aws cognito-idp describe-user-pool --user-pool-id $(terraform output -raw cognito_user_pool_id)

# 2. Test Lambda triggers
aws lambda invoke --function-name caveo-backend-dev-cognito-pre-signup /tmp/response.json

# 3. Verify JWKS endpoint
curl $(terraform output -raw cognito_jwks_uri)
```

This Terraform setup provisions the complete AWS Cognito infrastructure required for JWT-based authentication with role-based authorization.

## Related Documentation
- [Application Architecture](../architecture/README.md) - Complete application design and integration details
- [API Documentation](../api/README.md) - REST API endpoints and usage
