variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "caveo-backend"
}

variable "cognito_callback_urls" {
  description = "Callback URLs for Cognito"
  type        = list(string)
  default     = ["http://localhost:3000/callback"]
}

variable "cognito_logout_urls" {
  description = "Logout URLs for Cognito"
  type        = list(string)
  default     = ["http://localhost:3000/logout"]
}
