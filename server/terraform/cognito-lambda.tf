# Create the Lambda function code
data "archive_file" "pre_signup_zip" {
  type        = "zip"
  output_path = "${path.module}/pre_signup.zip"
  source {
    content  = <<EOF
// Lambda handler for auto-confirming Cognito users
exports.handler = async (event) => {
  console.log('PreSignUp trigger event:', JSON.stringify(event, null, 2));

  // Auto-confirm the user (no email verification needed)
  event.response.autoConfirmUser = true;

  // Auto-verify the email attribute
  event.response.autoVerifyEmail = true;

  return event;
};
EOF
    filename = "index.js"
  }
}

# Create the Pre Token Generation Lambda function code
data "archive_file" "pre_token_generation_zip" {
  type        = "zip"
  output_path = "${path.module}/pre_token_generation.zip"
  source {
    content  = <<EOF
exports.handler = async (event) => {
  event.response = {
    claimsAndScopeOverrideDetails: {
      accessTokenGeneration: {
        claimsToAddOrOverride: {
          internalId: event.request.userAttributes['custom:internalId'],
        },
      },
    },
  };

  return event;
};
EOF
    filename = "index.js"
  }
}

# Lambda function for auto-confirming users
resource "aws_lambda_function" "cognito_pre_signup" {
  filename      = data.archive_file.pre_signup_zip.output_path
  function_name = "${var.app_name}-${var.environment}-cognito-pre-signup"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 30

  source_code_hash = data.archive_file.pre_signup_zip.output_base64sha256

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
  ]

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# Lambda function for pre-token generation
resource "aws_lambda_function" "cognito_pre_token_generation" {
  filename      = data.archive_file.pre_token_generation_zip.output_path
  function_name = "${var.app_name}-${var.environment}-cognito-pre-token-generation"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 30

  source_code_hash = data.archive_file.pre_token_generation_zip.output_base64sha256

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
  ]

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# IAM role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${var.app_name}-${var.environment}-cognito-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# Attach basic Lambda execution policy (includes CloudWatch Logs)
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

# Permission for Cognito to invoke Lambda functions
resource "aws_lambda_permission" "cognito_invoke_pre_signup" {
  statement_id  = "AllowCognitoInvokePreSignup"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cognito_pre_signup.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.main.arn
}

resource "aws_lambda_permission" "cognito_invoke_pre_token_generation" {
  statement_id  = "AllowCognitoInvokePreTokenGeneration"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cognito_pre_token_generation.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.main.arn
}
