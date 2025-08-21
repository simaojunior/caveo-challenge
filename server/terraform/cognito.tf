# Cognito User Pool
resource "aws_cognito_user_pool" "main" {
  name = "${var.app_name}-${var.environment}-user-pool"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  # Add admin create user config
  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  # Lambda triggers
  lambda_config {
    pre_sign_up = aws_lambda_function.cognito_pre_signup.arn
    pre_token_generation_config {
      lambda_arn     = aws_lambda_function.cognito_pre_token_generation.arn
      lambda_version = "V2_0"
    }
  }

  schema {
    name                     = "email"
    attribute_data_type      = "String"
    mutable                  = true
    required                 = true
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name                     = "name"
    attribute_data_type      = "String"
    mutable                  = true
    required                 = false
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name                     = "internalId"
    attribute_data_type      = "String"
    mutable                  = false
    required                 = false
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 1
      max_length = 255
    }
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# Cognito User Pool Client
resource "aws_cognito_user_pool_client" "client" {
  name         = "${var.app_name}-${var.environment}-client"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = true
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]

  supported_identity_providers = ["COGNITO"]

  # OAuth settings - only needed if using hosted UI
  # For direct API authentication, these can be minimal
  allowed_oauth_flows_user_pool_client = false

  read_attributes = [
    "email",
    "email_verified",
    "custom:internalId",
    "name",
    "preferred_username"
  ]

  write_attributes = [
    "email",
    "name",
    "custom:internalId"
  ]

  access_token_validity  = 12
  id_token_validity      = 12
  refresh_token_validity = 30

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  prevent_user_existence_errors = "ENABLED"
}

# Admin Group
resource "aws_cognito_user_group" "admin" {
  name         = "admin"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Admin users group"
  precedence   = 1
}

# User Group
resource "aws_cognito_user_group" "user" {
  name         = "user"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Regular users group"
  precedence   = 2
}

# Resource Server for custom scopes
resource "aws_cognito_resource_server" "api" {
  identifier = "${var.app_name}-api"
  name       = "${var.app_name} API"

  scope {
    scope_name        = "admin"
    scope_description = "Admin scope - full access to all resources"
  }

  scope {
    scope_name        = "user"
    scope_description = "User scope - limited access to user resources"
  }

  scope {
    scope_name        = "read"
    scope_description = "Read access to resources"
  }

  scope {
    scope_name        = "write"
    scope_description = "Write access to resources"
  }

  user_pool_id = aws_cognito_user_pool.main.id
}
