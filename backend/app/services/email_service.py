import logging

import resend

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_password_reset_email(
    recipient_email: str,
    recipient_name: str,
    reset_url: str,
) -> None:
    if not settings.RESEND_API_KEY:
        raise RuntimeError("RESEND_API_KEY is not configured")

    resend.api_key = settings.RESEND_API_KEY

    safe_name = recipient_name.strip() or "there"

    email_html = f"""
    <!DOCTYPE html>
    <html lang="en">
      <body style="
        margin: 0;
        padding: 32px 16px;
        background: #f8fafc;
        color: #0f172a;
        font-family: Arial, Helvetica, sans-serif;
      ">
        <div style="
          max-width: 560px;
          margin: 0 auto;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          background: #ffffff;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
        ">
          <div style="
            padding: 28px;
            background: linear-gradient(
              135deg,
              #4a6ded 0%,
              #762bbc 52%,
              #cf4de1 100%
            );
            color: #ffffff;
          ">
            <h1 style="margin: 0; font-size: 28px;">FlowMind</h1>
            <p style="margin: 8px 0 0; opacity: 0.9;">
              Password reset request
            </p>
          </div>

          <div style="padding: 32px 28px;">
            <p style="margin-top: 0; font-size: 16px;">
              Hi {safe_name},
            </p>

            <p style="font-size: 15px; line-height: 1.7; color: #475569;">
              We received a request to reset your FlowMind password.
              Click the button below to create a new password.
            </p>

            <a
              href="{reset_url}"
              style="
                display: inline-block;
                margin: 18px 0;
                padding: 14px 22px;
                border-radius: 14px;
                background: linear-gradient(
                  135deg,
                  #4a6ded 0%,
                  #762bbc 52%,
                  #cf4de1 100%
                );
                color: #ffffff;
                font-weight: 700;
                text-decoration: none;
              "
            >
              Reset password
            </a>

            <p style="font-size: 14px; line-height: 1.7; color: #64748b;">
              This link expires in
              {settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES} minutes.
            </p>

            <p style="font-size: 14px; line-height: 1.7; color: #64748b;">
              If you did not request a password reset, you can safely ignore
              this email. Your current password will remain unchanged.
            </p>

            <hr style="
              margin: 28px 0;
              border: 0;
              border-top: 1px solid #e2e8f0;
            ">

            <p style="margin-bottom: 0; font-size: 12px; color: #94a3b8;">
              FlowMind — Focus. Flow. Achieve.
            </p>
          </div>
        </div>
      </body>
    </html>
    """

    try:
        resend.Emails.send(
            {
                "from": settings.EMAIL_FROM,
                "to": [recipient_email],
                "subject": "Reset your FlowMind password",
                "html": email_html,
            }
        )
    except Exception:
        logger.exception(
            "Failed to send password reset email to %s",
            recipient_email,
        )
        raise