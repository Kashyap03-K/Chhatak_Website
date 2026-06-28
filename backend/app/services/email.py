import logging

import resend

from app.core.config import settings
from app.models.order import Order

logger = logging.getLogger(__name__)


def send_order_confirmation(order: Order, pdf_bytes: bytes) -> bool:
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set — skipping email for order %d", order.id)
        return False

    resend.api_key = settings.RESEND_API_KEY

    user_email = order.user.email if order.user else None
    if not user_email:
        logger.warning("No email for user on order %d", order.id)
        return False

    items_html = "".join(
        f"<tr><td style='padding:8px 12px;border-bottom:1px solid #eee'>{item.product.name if item.product else 'Product'}</td>"
        f"<td style='padding:8px 12px;border-bottom:1px solid #eee;text-align:center'>{item.quantity}</td>"
        f"<td style='padding:8px 12px;border-bottom:1px solid #eee;text-align:right'>₹{item.total_price:.2f}</td></tr>"
        for item in order.items
    )

    html = f"""
    <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e">
        <div style="background:#1a1a2e;padding:32px;text-align:center">
            <h1 style="color:#E89148;margin:0;font-size:28px">Chhatak</h1>
            <p style="color:#aaa;margin:8px 0 0;font-size:14px">The Coastal Crunch</p>
        </div>

        <div style="padding:32px">
            <h2 style="color:#1a1a2e;margin:0 0 8px">Order confirmed!</h2>
            <p style="color:#666;margin:0 0 24px">Thanks for your order, {order.user.name}. Here's your summary.</p>

            <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin-bottom:24px">
                <p style="margin:0;font-size:14px"><strong>Order #</strong> {order.id}</p>
                <p style="margin:4px 0 0;font-size:14px"><strong>Date:</strong> {order.created_at.strftime('%d %b %Y, %I:%M %p')}</p>
            </div>

            <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
                <thead>
                    <tr style="background:#1a1a2e;color:white;font-size:13px">
                        <th style="padding:10px 12px;text-align:left">Item</th>
                        <th style="padding:10px 12px;text-align:center">Qty</th>
                        <th style="padding:10px 12px;text-align:right">Total</th>
                    </tr>
                </thead>
                <tbody>{items_html}</tbody>
                <tfoot>
                    <tr>
                        <td colspan="2" style="padding:12px;text-align:right;font-weight:bold;font-size:16px">Total</td>
                        <td style="padding:12px;text-align:right;font-weight:bold;font-size:16px;color:#E89148">₹{order.total_amount:.2f}</td>
                    </tr>
                </tfoot>
            </table>

            {f'<div style="margin-bottom:24px"><strong>Shipping to:</strong><br/><span style="color:#666">{order.shipping_address.replace(chr(10), "<br/>")}</span></div>' if order.shipping_address else ''}

            <p style="color:#888;font-size:13px">Your invoice is attached as a PDF. If you have any questions, reply to this email.</p>
        </div>

        <div style="background:#f0f0f0;padding:16px;text-align:center;font-size:12px;color:#999">
            Chhatak™ — The Coastal Crunch
        </div>
    </div>
    """

    try:
        resend.Emails.send({
            "from": settings.FROM_EMAIL,
            "to": [user_email],
            "subject": f"Chhatak — Order #{order.id} confirmed!",
            "html": html,
            "attachments": [{
                "filename": f"chhatak-invoice-{order.id}.pdf",
                "content": list(pdf_bytes),
            }],
        })
        logger.info("Order confirmation email sent for order %d to %s", order.id, user_email)
        return True
    except Exception as e:
        logger.error("Failed to send email for order %d: %s", order.id, e)
        return False
