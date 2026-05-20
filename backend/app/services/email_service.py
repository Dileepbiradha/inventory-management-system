import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings


# ============================================
# 📧 SEND EMAIL HELPER FUNCTION
# ============================================
def send_email(to_email: str, subject: str, html_content: str):
    """Send email using SMTP."""
    
    try:
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = settings.MAIL_FROM
        message["To"] = to_email
        
        # Attach HTML content
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        # Connect to SMTP server and send
        with smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT) as server:
            server.starttls()
            server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            server.send_message(message)
        
        print(f"✅ Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send email: {str(e)}")
        return False


# ============================================
# 🔑 PASSWORD RESET EMAIL
# ============================================
def send_password_reset_email(email: str, username: str, reset_token: str):
    """Send password reset email with token link."""
    
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    
    subject = "🔑 Password Reset Request - Inventory Management System"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }}
            .content {{
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }}
            .button {{
                display: inline-block;
                padding: 12px 30px;
                background: #667eea;
                color: white !important;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: bold;
            }}
            .footer {{
                text-align: center;
                color: #888;
                font-size: 12px;
                margin-top: 20px;
            }}
            .warning {{
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 10px;
                margin: 20px 0;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🔑 Password Reset Request</h1>
        </div>
        <div class="content">
            <h2>Hello {username}! 👋</h2>
            <p>We received a request to reset your password for your Inventory Management System account.</p>
            <p>Click the button below to reset your password:</p>
            
            <div style="text-align: center;">
                <a href="{reset_link}" class="button">🔓 Reset My Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="background: #fff; padding: 10px; border-radius: 5px; word-break: break-all;">
                <a href="{reset_link}">{reset_link}</a>
            </p>
            
            <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                    <li>This link will expire in {settings.RESET_TOKEN_EXPIRE_MINUTES} minutes</li>
                    <li>If you didn't request this, please ignore this email</li>
                    <li>Your password will not change until you click the link above</li>
                </ul>
            </div>
            
            <p>For security reasons, please don't share this email with anyone.</p>
        </div>
        <div class="footer">
            <p>© 2026 Inventory Management System. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
        </div>
    </body>
    </html>
    """
    
    return send_email(email, subject, html_content)


# ============================================
# ✅ PASSWORD CHANGED NOTIFICATION
# ============================================
def send_password_changed_notification(email: str, username: str):
    """Send notification email when password is changed."""
    
    subject = "✅ Password Changed Successfully - Inventory Management System"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }}
            .content {{
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }}
            .footer {{
                text-align: center;
                color: #888;
                font-size: 12px;
                margin-top: 20px;
            }}
            .alert {{
                background: #f8d7da;
                border-left: 4px solid #dc3545;
                padding: 10px;
                margin: 20px 0;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>✅ Password Changed</h1>
        </div>
        <div class="content">
            <h2>Hello {username}! 👋</h2>
            <p>This is a confirmation that your password has been successfully changed.</p>
            
            <div class="alert">
                <strong>🚨 Didn't change your password?</strong>
                <p>If you did NOT make this change, your account may be compromised. Please:</p>
                <ul>
                    <li>Contact our support team immediately</li>
                    <li>Reset your password again</li>
                    <li>Review your recent account activity</li>
                </ul>
            </div>
            
            <p>If you made this change, you can safely ignore this email.</p>
            <p>For your security, we recommend:</p>
            <ul>
                <li>🔒 Use a strong, unique password</li>
                <li>🔐 Enable two-factor authentication if available</li>
                <li>👀 Never share your password with anyone</li>
            </ul>
        </div>
        <div class="footer">
            <p>© 2026 Inventory Management System. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
        </div>
    </body>
    </html>
    """
    # ============================================
# 📧 SEND VERIFICATION EMAIL
# ============================================

def send_verification_email(email: str, username: str, verification_token: str):
    """Send email verification link to a newly registered user."""

    verify_link = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"

    subject = "📧 Verify Your Email - Inventory Management System"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }}
            .content {{
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }}
            .button {{
                display: inline-block;
                padding: 14px 36px;
                background: #4facfe;
                color: white !important;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
                font-weight: bold;
            }}
            .footer {{
                text-align: center;
                color: #888;
                font-size: 12px;
                margin-top: 20px;
            }}
            .info {{
                background: #e7f3ff;
                border-left: 4px solid #2196F3;
                padding: 12px;
                margin: 20px 0;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>📧 Verify Your Email</h1>
        </div>
        <div class="content">
            <h2>Welcome, {username}! 🎉</h2>
            <p>Thanks for signing up for the <strong>Inventory Management System</strong>.</p>
            <p>Please confirm your email address by clicking the button below:</p>

            <div style="text-align: center;">
                <a href="{verify_link}" class="button">✅ Verify My Email</a>
            </div>

            <p>Or copy and paste this link into your browser:</p>
            <p style="background: #fff; padding: 10px; border-radius: 5px; word-break: break-all;">
                <a href="{verify_link}">{verify_link}</a>
            </p>

            <div class="info">
                <strong>ℹ️ Heads up:</strong>
                <ul>
                    <li>This link expires in {settings.VERIFICATION_TOKEN_EXPIRE_MINUTES // 60} hours</li>
                    <li>You won't be able to log in until your email is verified</li>
                    <li>If you didn't create this account, you can safely ignore this email</li>
                </ul>
            </div>
        </div>
        <div class="footer">
            <p>© 2026 Inventory Management System. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
        </div>
    </body>
    </html>
    """

   
    return send_email(email, subject, html_content)