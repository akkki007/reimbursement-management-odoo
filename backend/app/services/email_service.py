import asyncio
import smtplib
from email.message import EmailMessage

from app.config import get_settings


def _send_email_sync(to: str, subject: str, body_html: str) -> None:
    settings = get_settings()
    msg = EmailMessage()
    msg["From"] = settings.smtp_from_email
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body_html, subtype="html")

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        server.starttls()
        server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(msg)


async def _send_email(to: str, subject: str, body_html: str) -> None:
    await asyncio.to_thread(_send_email_sync, to, subject, body_html)


async def send_generated_password_email(to_email: str, temp_password: str) -> None:
    subject = "ReimburseFlow — Your Account Password"
    body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Your Account Password</h2>
        <p style="color: #444; line-height: 1.6;">
            Your administrator has set up your ReimburseFlow account. Use the temporary password below to sign in.
        </p>
        <div style="margin: 24px 0; padding: 16px; background-color: #f8f4e8;
                    border-radius: 8px; text-align: center;">
            <code style="font-size: 18px; font-weight: 600; color: #1a1a2e; letter-spacing: 1px;">
                {temp_password}
            </code>
        </div>
        <p style="color: #444; line-height: 1.6;">
            After signing in, we recommend changing your password using the
            <strong>Forgot password?</strong> option on the login page.
        </p>
    </div>
    """
    await _send_email(to_email, subject, body)
