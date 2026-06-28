import io
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_CENTER

from app.models.order import Order


def generate_invoice_pdf(order: Order) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=30 * mm, bottomMargin=20 * mm, leftMargin=20 * mm, rightMargin=20 * mm)
    styles = getSampleStyleSheet()

    brand = ParagraphStyle("Brand", parent=styles["Title"], fontSize=28, textColor=colors.HexColor("#E89148"), fontName="Helvetica-Bold")
    heading = ParagraphStyle("Heading", parent=styles["Heading2"], fontSize=14, textColor=colors.HexColor("#1a1a2e"))
    right = ParagraphStyle("Right", parent=styles["Normal"], alignment=TA_RIGHT, fontSize=10, textColor=colors.HexColor("#666666"))
    small = ParagraphStyle("Small", parent=styles["Normal"], fontSize=9, textColor=colors.HexColor("#888888"))
    center = ParagraphStyle("Center", parent=styles["Normal"], alignment=TA_CENTER, fontSize=9, textColor=colors.HexColor("#888888"))

    elements = []

    header_data = [
        [Paragraph("Chhatak", brand), Paragraph(f"Invoice #{order.id}<br/>Date: {order.created_at.strftime('%d %b %Y')}", right)],
    ]
    header_table = Table(header_data, colWidths=[300, 200])
    header_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    elements.append(header_table)
    elements.append(Spacer(1, 8 * mm))

    if order.shipping_address:
        elements.append(Paragraph("Ship to", heading))
        for line in order.shipping_address.split("\n"):
            elements.append(Paragraph(line, styles["Normal"]))
        elements.append(Spacer(1, 8 * mm))

    elements.append(Paragraph("Order details", heading))
    elements.append(Spacer(1, 3 * mm))

    table_data = [["#", "Product", "Qty", "Unit price", "Total"]]
    for i, item in enumerate(order.items, 1):
        name = item.product.name if item.product else f"Product #{item.product_id}"
        table_data.append([str(i), name, str(item.quantity), f"₹{item.unit_price:.2f}", f"₹{item.total_price:.2f}"])

    table_data.append(["", "", "", "Subtotal", f"₹{sum(i.total_price for i in order.items):.2f}"])
    shipping = 49 if order.total_amount < 499 else 0
    table_data.append(["", "", "", "Shipping", f"₹{shipping:.2f}" if shipping else "Free"])
    table_data.append(["", "", "", "Total", f"₹{order.total_amount:.2f}"])

    t = Table(table_data, colWidths=[30, 220, 50, 80, 80])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a2e")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("FONTSIZE", (0, 1), (-1, -1), 10),
        ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
        ("TOPPADDING", (0, 0), (-1, 0), 10),
        ("BOTTOMPADDING", (0, 1), (-1, -4), 8),
        ("TOPPADDING", (0, 1), (-1, -4), 8),
        ("LINEBELOW", (0, 0), (-1, -4), 0.5, colors.HexColor("#dddddd")),
        ("LINEABOVE", (3, -3), (-1, -3), 0.5, colors.HexColor("#dddddd")),
        ("FONTNAME", (3, -1), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (3, -1), (-1, -1), 12),
        ("TOPPADDING", (0, -1), (-1, -1), 10),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 15 * mm))

    elements.append(Paragraph(f"Status: {order.status.replace('_', ' ').title()}", small))
    elements.append(Spacer(1, 20 * mm))
    elements.append(Paragraph("Thank you for shopping with Chhatak — The Coastal Crunch!", center))

    doc.build(elements)
    return buf.getvalue()
