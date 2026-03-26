import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app

class EmailService:
    """Email service using Brevo SMTP"""
    
    @staticmethod
    def send_email(to_email, subject, html_content, text_content=None):
        """
        Send email using Brevo SMTP
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML email body
            text_content: Plain text email body (optional)
        
        Returns:
            dict: {'success': bool, 'message': str}
        """
        try:
            # Get SMTP configuration from environment
            smtp_host = os.getenv('SMTP_HOST')
            smtp_port = int(os.getenv('SMTP_PORT', 587))
            smtp_user = os.getenv('SMTP_USER')
            smtp_password = os.getenv('SMTP_PASSWORD')
            from_email = os.getenv('SMTP_FROM_EMAIL')
            from_name = os.getenv('SMTP_FROM_NAME', 'HRMS')
            
            if not all([smtp_host, smtp_user, smtp_password, from_email]):
                current_app.logger.error("SMTP configuration missing in environment variables")
                return {'success': False, 'message': 'Email service not configured'}
            
            current_app.logger.info(f"Sending email to {to_email} from {from_email} via {smtp_host}:{smtp_port}")
            
            # Create message
            message = MIMEMultipart('alternative')
            message['Subject'] = subject
            message['From'] = f"{from_name} <{from_email}>"
            message['To'] = to_email
            
            # Add plain text version if provided
            if text_content:
                part1 = MIMEText(text_content, 'plain')
                message.attach(part1)
            
            # Add HTML version
            part2 = MIMEText(html_content, 'html')
            message.attach(part2)
            
            # Send email
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.sendmail(from_email, to_email, message.as_string())
            
            current_app.logger.info(f"Email sent successfully to {to_email}")
            return {'success': True, 'message': 'Email sent successfully'}
            
        except Exception as e:
            current_app.logger.error(f"Failed to send email: {str(e)}")
            return {'success': False, 'message': f'Failed to send email: {str(e)}'}
    
    @staticmethod
    def send_password_reset_email(to_email, reset_code, company_name="HRMS"):
        """
        Send password reset email with 6-digit code
        
        Args:
            to_email: Recipient email address
            reset_code: 6-digit reset code
            company_name: Company name for branding
        
        Returns:
            dict: {'success': bool, 'message': str}
        """
        subject = f"{company_name} - Password Reset Code"
        
        # HTML email template
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }}
                .container {{
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
                .code-box {{
                    background: white;
                    border: 2px dashed #667eea;
                    padding: 20px;
                    text-align: center;
                    margin: 20px 0;
                    border-radius: 8px;
                }}
                .code {{
                    font-size: 32px;
                    font-weight: bold;
                    color: #667eea;
                    letter-spacing: 8px;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 20px;
                    font-size: 12px;
                    color: #666;
                }}
                .warning {{
                    background: #fff3cd;
                    border-left: 4px solid #ffc107;
                    padding: 12px;
                    margin: 20px 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset Request</h1>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    <p>We received a request to reset your password for your {company_name} account.</p>
                    <p>Use the following code to reset your password:</p>
                    
                    <div class="code-box">
                        <div class="code">{reset_code}</div>
                    </div>
                    
                    <div class="warning">
                        <strong>⚠️ Important:</strong>
                        <ul style="margin: 10px 0;">
                            <li>This code will expire in <strong>15 minutes</strong></li>
                            <li>Do not share this code with anyone</li>
                            <li>If you didn't request this, please ignore this email</li>
                        </ul>
                    </div>
                    
                    <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                </div>
                <div class="footer">
                    <p>This is an automated email from {company_name}. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Plain text version
        text_content = f"""
        Password Reset Request
        
        Hello,
        
        We received a request to reset your password for your {company_name} account.
        
        Your password reset code is: {reset_code}
        
        This code will expire in 15 minutes.
        
        If you didn't request a password reset, you can safely ignore this email.
        
        ---
        This is an automated email from {company_name}. Please do not reply to this email.
        """
        
        return EmailService.send_email(to_email, subject, html_content, text_content)
