output "cognito_user_pool_id" {
  value       = aws_cognito_user_pool.main.id
  description = "The ID of the Cognito User Pool"
}

output "cognito_user_pool_arn" {
  value       = aws_cognito_user_pool.main.arn
  description = "The ARN of the Cognito User Pool"
}

output "cognito_client_id" {
  value       = aws_cognito_user_pool_client.client.id
  description = "The ID of the Cognito User Pool Client"
  sensitive   = true
}

output "cognito_client_secret" {
  value       = aws_cognito_user_pool_client.client.client_secret
  description = "The secret of the Cognito User Pool Client"
  sensitive   = true
}

output "cognito_issuer_url" {
  value       = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.main.id}"
  description = "The issuer URL for JWT validation"
}

output "cognito_jwks_uri" {
  value       = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.main.id}/.well-known/jwks.json"
  description = "The JWKS URI for JWT validation"
}
