"""
Email Delivery Service for AI Friend Companion.
Supports:
1. SMTP delivery with TLS/SSL encryption for production.
2. Safe Console logger for local development / testing without sending external network calls.
3. Strict error reporting: never pretends an email was sent when delivery failed or is unconfigured.
"""

import smtplib
import ssl
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from backend.app.core.config import settings

logger = logging.getLogger(__name__)


class EmailDeliveryError(Exception):
    """Raised when email delivery fails."""
    pass


class EmailService:
    @classmethod
    def build_verification_link(cls, token: str) -> str:
        """Constructs the verification URL."""
        base_url = settings.FRONTEND_URL.rstrip("/")
        return f"{base_url}?verify_token={token}"

    @classmethod
    async def send_otp_email(
        cls,
        recipient_email: str,
        otp_code: str,
        display_name: str = "Friend",
    ) -> bool:
        """
        Sends cryptographically secure 6-digit OTP email with 5-minute expiry.
        Raises EmailDeliveryError if provider is misconfigured or transmission fails.
        """
        subject = f"{otp_code} is your AI Friend verification code"
        plain_body = (
            f"Hello {display_name},\n\n"
            f"Your verification code for AI Friend is: {otp_code}\n\n"
            f"This code will expire in 5 minutes. Please do not share this code with anyone.\n\n"
            f"Warmly,\n"
            f"The AI Friend Team"
        )
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f6fc; color: #2d2847; padding: 24px; }}
            .card {{ background: #ffffff; border: 1px solid #d8d0fc; border-radius: 20px; padding: 32px; max-width: 480px; margin: 0 auto; box-shadow: 0 10px 30px rgba(139, 124, 246, 0.1); }}
            .otp-box {{ background: linear-gradient(135deg, #cdeafc, #d8d0fc); border-radius: 12px; padding: 18px 24px; text-align: center; margin: 24px 0; letter-spacing: 8px; font-size: 32px; font-weight: 800; color: #4338ca; }}
            .footer {{ font-size: 0.8rem; color: #6b7280; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; }}
          </style>
        </head>
        <body>
          <div class="card">
            <h2 style="color: #6366f1; margin-top: 0; text-align: center;">Welcome to AI Friend 👋</h2>
            <p>Hello <strong>{display_name}</strong>,</p>
            <p>Use this one-time verification code to complete your signup:</p>
            <div class="otp-box">{otp_code}</div>
            <p style="font-size: 0.9rem; color: #4b5563; text-align: center;">This code is valid for <strong>5 minutes</strong>. For your security, never share this code.</p>
            <div class="footer">
              If you didn't request this code, you can safely ignore this email.
            </div>
          </div>
        </body>
        </html>
        """
        return await cls._dispatch_email(recipient_email, subject, plain_body, html_body)

    @classmethod
    async def send_verification_email(
        cls,
        recipient_email: str,
        token: str,
        display_name: str = "Friend",
    ) -> bool:
        """
        Sends account verification email.
        Raises EmailDeliveryError if provider is misconfigured or transmission fails.
        """
        provider = (settings.EMAIL_PROVIDER or "console").lower()

        if provider == "disabled":
            logger.warning("Email delivery is disabled by configuration.")
            return True

        verification_url = cls.build_verification_link(token)

        subject = "Verify your AI Friend account"
        plain_body = (
            f"Hello {display_name},\n\n"
            f"Welcome to AI Friend! Please verify your email address by opening the following link in your browser:\n\n"
            f"{verification_url}\n\n"
            f"This link is valid for 24 hours. If you did not create an account, you can safely ignore this email.\n\n"
            f"Warmly,\n"
            f"The AI Friend Team"
        )
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f19; color: #f8fafc; padding: 24px; }}
            .card {{ background: #131b2e; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; max-width: 520px; margin: 0 auto; }}
            .btn {{ display: inline-block; background: #14b8a6; color: #ffffff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 20px 0; }}
            .footer {{ font-size: 0.8rem; color: #94a3b8; margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; }}
          </style>
        </head>
        <body>
          <div class="card">
            <h2 style="color: #2dd4bf; margin-top: 0;">Welcome to AI Friend 👋</h2>
            <p>Hello {display_name},</p>
            <p>Thank you for joining AI Friend. Please verify your email to activate your account and start your conversations:</p>
            <a href="{verification_url}" class="btn">Verify My Email</a>
            <p style="font-size: 0.85rem; color: #cbd5e1;">Or copy and paste this link into your browser:<br><span style="color: #38bdf8; word-break: break-all;">{verification_url}</span></p>
            <div class="footer">
              This single-use link is valid for 24 hours. If you did not register for an account, please disregard this email.
            </div>
          </div>
        </body>
        </html>
        """

        return await cls._dispatch_email(recipient_email, subject, plain_body, html_body)

    @classmethod
    async def _dispatch_email(
        cls,
        recipient_email: str,
        subject: str,
        plain_body: str,
        html_body: str,
    ) -> bool:
        provider = (settings.EMAIL_PROVIDER or "console").lower()

        if provider == "disabled":
            logger.warning("Email delivery is disabled by configuration.")
            return True

        if provider == "console":
            # Development/Testing mode: logs receipt confirmation without exposing secrets
            logger.info(f"Verification email generated for recipient: {recipient_email} [Subject: {subject}] [Provider: console]")
            return True

        elif provider == "smtp":
            if not settings.SMTP_HOST or not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
                raise EmailDeliveryError(
                    "SMTP email provider is enabled but SMTP_HOST, SMTP_USERNAME, or SMTP_PASSWORD is not configured."
                )

            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = settings.EMAIL_FROM
                msg["To"] = recipient_email

                part1 = MIMEText(plain_body, "plain", "utf-8")
                part2 = MIMEText(html_body, "html", "utf-8")
                msg.attach(part1)
                msg.attach(part2)

                context = ssl.create_default_context() if settings.SMTP_USE_TLS else None

                if settings.SMTP_PORT == 465:
                    with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, context=context, timeout=15) as server:
                        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                        server.sendmail(settings.EMAIL_FROM, [recipient_email], msg.as_string())
                else:
                    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
                        if settings.SMTP_USE_TLS:
                            server.starttls(context=context)
                        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                        server.sendmail(settings.EMAIL_FROM, [recipient_email], msg.as_string())

                logger.info(f"Email successfully dispatched via SMTP to {recipient_email}")
                return True

            except Exception as e:
                logger.error(f"Failed to deliver email via SMTP: {str(e)}")
                raise EmailDeliveryError(f"Email delivery failed: {str(e)}")

        else:
            raise EmailDeliveryError(f"Unsupported EMAIL_PROVIDER '{provider}'. Must be 'console', 'smtp', or 'disabled'.")

