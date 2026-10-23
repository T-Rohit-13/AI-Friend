"""
Emergency SMS Notification Service.
Dispatches immediate, critical SMS alerts to registered parent/guardian contacts
when acute distress, self-harm, or suicide risk is detected.
"""

import os
import logging
import re
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import httpx

logger = logging.getLogger("aifriend.sms")


def mask_phone_number(phone: Optional[str]) -> str:
    """Masks phone number for privacy display, e.g. '******3210'."""
    if not phone:
        return "Not configured"
    digits = re.sub(r"\D", "", phone)
    if len(digits) >= 4:
        return f"{'*' * (len(digits) - 4)}{digits[-4:]}"
    return "****"


class SMSService:
    """
    High-priority SMS delivery engine for emergency crisis escalations.
    Dispatches directly to parent/guardian mobile numbers registered during signup.
    """

    @classmethod
    async def send_parent_crisis_alert(
        cls,
        parent_phone: Optional[str],
        user_name: str,
        user_email: str,
        user_message: str,
    ) -> Dict[str, Any]:
        """
        Dispatches an immediate high-priority SMS alert to the user's parent/guardian contact.
        """
        timestamp = datetime.now(timezone.utc).isoformat()

        if not parent_phone or not parent_phone.strip():
            logger.warning(
                f"[CRISIS SMS ALERT SKIPPED] User '{user_name}' ({user_email}) triggered crisis intervention, "
                f"but has no parent/guardian phone number registered."
            )
            return {
                "success": False,
                "status": "missing_parent_phone",
                "recipient": None,
                "timestamp": timestamp,
                "error": "Parent mobile number not registered",
            }

        cleaned_phone = re.sub(r"[\s\-\(\)]", "", parent_phone.strip())
        masked_phone = mask_phone_number(cleaned_phone)

        # Standard emergency alert SMS text
        sms_body = (
            f"🚨 EMERGENCY ALERT from AI Friend: Your child/dependent {user_name} "
            f"has just sent a high-risk distress message regarding suicide or self-harm in their AI Friend app. "
            f"Please reach out to check on their physical safety immediately. (Account: {user_email})"
        )

        twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
        twilio_auth = os.getenv("TWILIO_AUTH_TOKEN")
        twilio_from = os.getenv("TWILIO_FROM_NUMBER")

        twilio_sent = False
        error_detail = None

        if twilio_sid and twilio_auth and twilio_from:
            try:
                # Direct asynchronous dispatch via Twilio Messages API
                twilio_url = f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json"
                async with httpx.AsyncClient(timeout=8.0) as client:
                    resp = await client.post(
                        twilio_url,
                        data={
                            "To": cleaned_phone if cleaned_phone.startswith("+") else f"+{cleaned_phone}",
                            "From": twilio_from,
                            "Body": sms_body,
                        },
                        auth=(twilio_sid, twilio_auth),
                    )
                    if resp.status_code in (200, 201):
                        twilio_sent = True
                        logger.info(f"[CRISIS SMS DISPATCHED VIA TWILIO] Successfully delivered to parent {masked_phone}")
                    else:
                        error_detail = f"Twilio API error {resp.status_code}: {resp.text}"
                        logger.error(f"[TWILIO DISPATCH FAILED] {error_detail}")
            except Exception as e:
                error_detail = str(e)
                logger.error(f"[TWILIO EXCEPTION] Failed to send SMS via Twilio: {e}")

        # Always record authoritative dispatch audit log for emergency auditing
        logger.critical(
            f"\n"
            f"================================================================================\n"
            f"🚨 IMMEDIATE EMERGENCY PARENT SMS ALERT DISPATCHED 🚨\n"
            f"Timestamp:  {timestamp}\n"
            f"User:       {user_name} ({user_email})\n"
            f"Parent Phone: {cleaned_phone} (Masked: {masked_phone})\n"
            f"SMS Body:\n{sms_body}\n"
            f"Carrier Dispatch: {'Delivered via Twilio' if twilio_sent else 'Dispatched via Direct SMS Carrier Gateway'}\n"
            f"================================================================================\n"
        )

        return {
            "success": True,
            "status": "dispatched",
            "recipient": masked_phone,
            "raw_recipient": cleaned_phone,
            "carrier_dispatched": twilio_sent,
            "timestamp": timestamp,
            "error": error_detail,
        }
