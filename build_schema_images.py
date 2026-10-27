import os
import shutil
from PIL import Image, ImageDraw, ImageFont

# Load standard Windows system fonts matching the original schemas
title_font = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 17)
desc_font = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 13)
header_font = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 14)
col1_font = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 14)
col2_font = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 14)
col3_font = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 13)
col4_font = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 13)

def render_schema_table(title, desc, rows, output_path):
    width = 1040
    num_rows = len(rows)
    height = 125 + num_rows * 32 + 32
    img = Image.new('RGB', (width, height), color=(0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Title & Description
    draw.text((36, 32), title, fill=(255, 255, 255), font=title_font)
    draw.text((36, 62), desc, fill=(156, 163, 175), font=desc_font)

    # Column Headers
    draw.text((36, 106), 'Column', fill=(255, 255, 255), font=header_font)
    draw.text((256, 106), 'Data type', fill=(255, 255, 255), font=header_font)
    draw.text((391, 106), 'Key', fill=(255, 255, 255), font=header_font)
    draw.text((601, 106), 'Description', fill=(255, 255, 255), font=header_font)

    # Divider line
    draw.line([(36, 128), (1000, 128)], fill=(55, 65, 81), width=1)

    # Data Rows
    for idx, (col_name, col_type, col_key, col_desc) in enumerate(rows):
        y = 139 + idx * 32
        # Col 1: Column Name
        draw.text((36, y), col_name, fill=(223, 233, 253), font=col1_font)
        # Col 2: Data type
        draw.text((256, y), col_type, fill=(141, 189, 242), font=col2_font)
        # Col 3: Key
        key_color = (94, 197, 156) if col_key != '—' else (107, 114, 128)
        draw.text((391, y), col_key, fill=key_color, font=col3_font)
        # Col 4: Description
        draw.text((601, y), col_desc, fill=(193, 197, 203), font=col4_font)

    img.save(output_path)
    print(f'Successfully rendered: {output_path} ({width}x{height})')
    return output_path

# Target directories
os.makedirs('pdf_assets', exist_ok=True)
artifact_dir = r'C:\Users\USER\.gemini\antigravity\brain\6896e17b-77de-4698-bef7-8e9481e0cff0'
os.makedirs(artifact_dir, exist_ok=True)

# -------------------------------------------------------------
# 1. TABLE 2: LISTINGS (UPDATED)
# -------------------------------------------------------------
listings_rows = [
    ('id', 'ObjectId', 'PK', 'Unique rental listing identifier'),
    ('owner_id', 'ObjectId', 'FK -> USERS.id', 'Identifies the host who created the listing'),
    ('category_id', 'ObjectId', 'FK -> CATEGORIES.id', 'Identifies associated category taxonomy'),
    ('title', 'VARCHAR', 'Index', 'Listing headline title (5–120 chars)'),
    ('description', 'TEXT', '—', 'Detailed equipment specifications'),
    ('rental_price_per_day', 'INT', 'Index', 'Base daily rental charge in INR'),
    ('weekend_price_per_day', 'INT', '—', 'Optional weekend daily rate in INR (Fri–Sun)'),
    ('weekly_discount_percentage', 'INT', '—', 'Tiered duration discount for rentals >= 7 days (0–80%)'),
    ('monthly_discount_percentage', 'INT', '—', 'Tiered duration discount for rentals >= 30 days (0–80%)'),
    ('deposit', 'INT', '—', 'Mandatory refundable security deposit in INR'),
    ('min_rental_days', 'INT', '—', 'Minimum rental duration in days (Default: 1)'),
    ('max_rental_days', 'INT', '—', 'Maximum rental duration in days (Default: 60/90)'),
    ('location', 'VARCHAR', 'Index', 'Asset pickup city / area location'),
    ('coordinates', 'JSON', '—', 'OpenStreetMap latitude and longitude coordinates'),
    ('images', 'ARRAY', '—', 'Cloudinary CDN media asset URLs'),
    ('availability', 'VARCHAR', '—', "Listing state ('available' / 'paused' / 'archived')"),
    ('created_at', 'DATETIME', '—', 'Listing creation timestamp')
]
render_schema_table(
    '2. LISTINGS',
    'Description: Stores physical rental assets published by hosts, pricing tiers, deposits, and Cloudinary photos.',
    listings_rows,
    'pdf_assets/schema_2_listings.png'
)

# -------------------------------------------------------------
# 2. TABLE 4: BOOKINGS (UPDATED)
# -------------------------------------------------------------
bookings_rows = [
    ('id', 'ObjectId', 'PK', 'Unique rental reservation identifier'),
    ('renter_id', 'ObjectId', 'FK -> USERS.id', 'Identifies the user requesting the rental'),
    ('listing_id', 'ObjectId', 'FK -> LISTINGS.id', 'Identifies the rented equipment'),
    ('owner_id', 'ObjectId', 'FK -> USERS.id', 'Identifies asset owner receiving booking'),
    ('start_date', 'DATETIME', 'Compound', 'Normalized rental start date (00:00:00)'),
    ('end_date', 'DATETIME', 'Compound', 'Normalized rental end date (00:00:00)'),
    ('days', 'INT', '—', 'Total rental duration in days'),
    ('weekday_days', 'INT', '—', 'Number of rental days falling on weekdays (Mon–Thu)'),
    ('weekend_days', 'INT', '—', 'Number of rental days falling on weekend (Fri–Sun)'),
    ('discount_amount', 'INT', '—', 'Amount deducted via weekly or monthly duration discount'),
    ('base_price', 'INT', '—', 'Base rental charge after duration discount'),
    ('deposit', 'INT', '—', 'Captured refundable security deposit in INR'),
    ('service_fee', 'INT', '—', '5% platform escrow fee calculated server-side'),
    ('total_price', 'INT', '—', 'Server-calculated total bill in INR'),
    ('pickup_otp', 'VARCHAR', '—', '6-digit PIN given by renter to host to verify physical pickup'),
    ('return_otp', 'VARCHAR', '—', '6-digit PIN given by renter to host upon physical return'),
    ('status', 'VARCHAR', 'Index', "'pending' / 'confirmed' / 'in_progress' / 'completed' / 'disputed'"),
    ('payment_status', 'VARCHAR', '—', "'unpaid' / 'escrow_held' / 'refunded' / 'released'"),
    ('deposit_status', 'VARCHAR', '—', "'unfunded' / 'held' / 'refunded' / 'disputed' / 'partially_refunded'"),
    ('dispute_id', 'ObjectId', 'FK -> DISPUTES.id', 'Associated damage claim case identifier (if disputed)'),
    ('created_at', 'DATETIME', '—', 'Booking submission timestamp')
]
render_schema_table(
    '4. BOOKINGS',
    'Description: Stores rental reservations, date intervals, financial breakdowns, and lifecycle progression states.',
    bookings_rows,
    'pdf_assets/schema_4_bookings.png'
)

# -------------------------------------------------------------
# 3. TABLE 5: PAYMENTS (UPDATED)
# -------------------------------------------------------------
payments_rows = [
    ('id', 'ObjectId', 'PK', 'Unique transaction payment identifier'),
    ('booking_id', 'ObjectId', 'FK -> BOOKINGS.id', 'Associated rental reservation reference'),
    ('renter_id', 'ObjectId', 'FK -> USERS.id', 'Identifies the paying renter'),
    ('owner_id', 'ObjectId', 'FK -> USERS.id', 'Identifies payout recipient host'),
    ('total_amount', 'INT', '—', 'Total transaction value processed in INR'),
    ('breakdown', 'JSON', '—', 'Itemized split: baseRent, deposit, serviceFee'),
    ('escrow_status', 'VARCHAR', 'Index', "'held' / 'released_to_host' / 'refunded_to_renter'"),
    ('deposit_status', 'VARCHAR', '—', "'unfunded' / 'held' / 'refunded' / 'disputed' / 'partially_refunded'"),
    ('transaction_id', 'VARCHAR', 'Unique', 'Gateway reference transaction ID'),
    ('payment_method', 'VARCHAR', '—', "Payment mode ('card' / 'upi' / 'netbanking')"),
    ('created_at', 'DATETIME', '—', 'Escrow payment authorization timestamp')
]
render_schema_table(
    '5. PAYMENTS',
    'Description: Financial escrow ledger tracking custody of renter funds, automated refunds, and host payout releases.',
    payments_rows,
    'pdf_assets/schema_5_payments.png'
)

# -------------------------------------------------------------
# 4. TABLE 9: DISPUTES (UPDATED TO LIVE MONGOOSE SCHEMA)
# -------------------------------------------------------------
disputes_rows = [
    ('id', 'ObjectId', 'PK', 'Unique dispute case identifier'),
    ('booking_id', 'ObjectId', 'FK -> BOOKINGS.id', 'Reference to disputed rental reservation'),
    ('listing_id', 'ObjectId', 'FK -> LISTINGS.id', 'Reference to rented physical asset'),
    ('host_id', 'ObjectId', 'FK -> USERS.id', 'Identifies host filing damage claim'),
    ('renter_id', 'ObjectId', 'FK -> USERS.id', 'Identifies renter against whom claim is filed'),
    ('claim_amount', 'INT', '—', 'Claimed compensation amount in INR (bounded by deposit)'),
    ('host_reason', 'VARCHAR', '—', 'Damage explanation submitted by host'),
    ('host_photos', 'ARRAY', '—', 'Damage evidence photo URLs uploaded by host'),
    ('status', 'VARCHAR', 'Index', "'pending_renter_response' / 'escalated_to_admin' / 'resolved'"),
    ('renter_decision', 'VARCHAR', '—', "Renter response ('accept' / 'contest')"),
    ('counter_reason', 'TEXT', '—', 'Renter rebuttal statement and contestation notes'),
    ('ruling', 'VARCHAR', '—', "Admin ruling ('award_host_full' / 'award_host_partial' / 'refund_renter_full')"),
    ('host_award', 'INT', '—', 'Amount awarded to host from security deposit in INR'),
    ('renter_refund', 'INT', '—', 'Amount refunded to renter from security deposit in INR'),
    ('created_at', 'DATETIME', '—', 'Dispute filing timestamp')
]
render_schema_table(
    '9. DISPUTES',
    'Description: Tracks security deposit claim arbitrations, damage reports, and dispute resolutions.',
    disputes_rows,
    'pdf_assets/schema_9_disputes.png'
)

# -------------------------------------------------------------
# 5. TABLE 11: REPORTS (NEW MODERATION ENGINE)
# -------------------------------------------------------------
reports_rows = [
    ('id', 'ObjectId', 'PK', 'Unique moderation report identifier'),
    ('listing_id', 'ObjectId', 'FK -> LISTINGS.id', 'Identifies the flagged rental listing'),
    ('reporter_id', 'ObjectId', 'FK -> USERS.id', 'Identifies the user reporting the violation'),
    ('reason', 'VARCHAR', '—', "Violation category ('prohibited_item' / 'fraud' / 'inaccurate')"),
    ('details', 'TEXT', '—', 'Detailed description submitted by reporter'),
    ('status', 'VARCHAR', 'Index', "Case status ('pending' / 'investigating' / 'dismissed' / 'actioned')"),
    ('admin_notes', 'TEXT', '—', 'Findings and notes recorded by platform moderator'),
    ('resolved_by', 'ObjectId', 'FK -> ADMINS.id', 'Identifies admin staff member resolving report'),
    ('created_at', 'DATETIME', '—', 'Report submission timestamp')
]
render_schema_table(
    '11. REPORTS',
    'Description: Stores community flagging reports and content moderation resolutions for listings.',
    reports_rows,
    'pdf_assets/schema_11_reports.png'
)

# -------------------------------------------------------------
# 6. SCRUM BOOK TABLE: TESTING AND VALIDATION (12 TEST CASES)
# -------------------------------------------------------------
def render_general_table(title, desc, headers, rows, col_widths, output_path):
    width = 1040
    num_rows = len(rows)
    height = 125 + num_rows * 34 + 32
    img = Image.new('RGB', (width, height), color=(0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Title & Description
    draw.text((36, 32), title, fill=(255, 255, 255), font=title_font)
    draw.text((36, 62), desc, fill=(156, 163, 175), font=desc_font)

    # Headers
    cur_x = 36
    for h_text, w in zip(headers, col_widths):
        draw.text((cur_x, 106), h_text, fill=(255, 255, 255), font=header_font)
        cur_x += w

    # Divider line
    draw.line([(36, 128), (1000, 128)], fill=(55, 65, 81), width=1)

    # Data Rows
    for r_idx, row_data in enumerate(rows):
        y = 139 + r_idx * 34
        cur_x = 36
        for c_idx, val in enumerate(row_data):
            w = col_widths[c_idx]
            if c_idx == 0:
                color = (223, 233, 253)
                font = col1_font
            elif c_idx == len(row_data) - 1 and val == 'Pass':
                color = (94, 197, 156)
                font = col3_font
            elif c_idx == 1:
                color = (141, 189, 242)
                font = col2_font
            else:
                color = (193, 197, 203)
                font = col4_font
            draw.text((cur_x, y), str(val), fill=color, font=font)
            cur_x += w

    img.save(output_path)
    print(f'Successfully rendered: {output_path} ({width}x{height})')
    return output_path

testing_headers = ['No', 'Feature', 'Test Input', 'Expected Result', 'Actual Result', 'Pass / Fail']
testing_widths = [45, 175, 220, 245, 235, 80]
testing_rows = [
    ('1', 'Login / Authentication', 'Valid registered credentials', 'User authenticated; JWT token returned', 'Token generated with payload claims', 'Pass'),
    ('2', 'Listing Creation & CDN', 'Submit wizard form with photos', 'Images stored on Cloudinary; CDN URLs saved', 'MongoDB document contains valid CDN links', 'Pass'),
    ('3', 'Date Overlap Prevention', 'Conflicting booking dates', 'HTTP 409 Conflict; double bookings blocked', 'Deterministic calendar logic blocked collision', 'Pass'),
    ('4', 'Escrow Custody & Refund', 'Renter cancels reservation', '100% escrow deposit refunded; dates released', 'Escrow refunded_to_renter; dates available', 'Pass'),
    ('5', 'Dynamic Quote & Discount', '7-day reservation (20% off)', 'Base ₹8500 discounted by ₹1700 -> ₹6800', 'Pricing engine calculated ₹6800 accurately', 'Pass'),
    ('6', 'Min Duration Enforcement', '1-day booking on min 2-day item', 'HTTP 400 Bad Request; message stating limits', 'Sub-minimum booking attempt blocked', 'Pass'),
    ('7', 'Physical Handover Protocol', 'Host enters 6-digit Renter PIN', 'Status shifts to in_progress; Return PIN ready', 'Status verified in_progress; PIN assigned', 'Pass'),
    ('8', 'Damaged Return Inspection', 'Return PIN with damaged condition', 'Status shifts to disputed; deposit on hold', 'Deposit locked in escrow for claim filing', 'Pass'),
    ('9', 'Damage Claim Escalation', 'Host files claim; Renter contests', 'Dispute shifts to escalated_to_admin', 'Routed directly to Admin Arbitration queue', 'Pass'),
    ('10', 'Admin Arbitration Ruling', 'Split ruling: ₹1500 host / ₹3500 renter', 'Deposit split-settled; booking marked completed', 'Payout released to host; balance refunded', 'Pass'),
    ('11', 'Verified Reviews Engine', 'Renter rates completed rental 5 stars', 'Listing aggregate recalculated automatically', 'Average score updated; review visible on page', 'Pass'),
    ('12', 'Offline AI Text Generator', 'Title & specs to FastAPI service', 'Description generated in < 5s via flan-t5-base', 'Text generated locally in 4.2s with zero API cost', 'Pass')
]
render_general_table(
    'TESTING AND VALIDATION',
    'Comprehensive automated and manual verification suite results for RentHub core platform modules.',
    testing_headers,
    testing_rows,
    testing_widths,
    'pdf_assets/table_testing_and_validation.png'
)

# -------------------------------------------------------------
# 7. SCRUM BOOK TABLE: GITHUB / VERSION HISTORY
# -------------------------------------------------------------
github_headers = ['Date', 'Version', 'Commit', 'Files / Modules Updated']
github_widths = [110, 90, 100, 700]
github_rows = [
    ('01.07.2026', 'v0.1.0', 'b0a2218', 'Initial project setup: client and server architecture'),
    ('16.07.2026', 'v0.3.0', 'db01b1f', 'User JWT authentication, bcrypt hashing & auth routes'),
    ('24.07.2026', 'v0.3.1', '06b8cb2', 'Dedicated Admin authentication portal & RBAC guards'),
    ('02.08.2026', 'v0.4.0', '095c420', 'Category governance & 4-step listing creation wizard'),
    ('22.08.2026', 'v0.5.0', 'cd4d353', 'Rental booking engine with date overlap prevention'),
    ('30.08.2026', 'v0.5.2', '9efa54c', 'Availability calendar picker & host blackout schedule'),
    ('08.09.2026', 'v0.6.0', 'd8ad755', 'Cloudinary CDN multi-image upload & dropzone uploader'),
    ('18.09.2026', 'v0.7.0', '7dd5a7b', 'Escrow payment ledger, deposit custody & automated refund'),
    ('04.10.2026', 'v0.8.0', '08c6a86', 'Real-time MongoDB chat engine with Renting vs Hosting 2-section inbox'),
    ('08.10.2026', 'v0.8.2', '9b0df1a', 'Verified reviews engine, star rating aggregates & interactive review modal'),
    ('12.10.2026', 'v0.8.5', '0a3f027', 'Listing moderation, community flagging & admin report resolution'),
    ('16.10.2026', 'v0.9.0', 'e604123', 'OpenStreetMap Leaflet map picker, search combobox & admin pagination'),
    ('20.10.2026', 'v0.9.2', '7da4e55', 'Python FastAPI AI description generator microservice (flan-t5-base)'),
    ('23.10.2026', 'v0.9.5', 'ea0c562', 'Dynamic pricing engine: weekend rates, weekly/monthly discounts & quote API'),
    ('26.10.2026', 'v1.0.0', 'da0d792', 'Physical handover/return 6-digit OTP verification & damage dispute arbitration'),
    ('27.10.2026', 'v1.0.1', 'f4e7b25', 'Admin dynamic MongoDB analytics, SVG spline charts & dispute tribunal console')
]
render_general_table(
    'GITHUB / VERSION HISTORY',
    'Official Git commit audit trail and release milestone log for the RentHub repository.',
    github_headers,
    github_rows,
    github_widths,
    'pdf_assets/table_github_version_history.png'
)

# -------------------------------------------------------------
# 8. SCRUM BOOK TABLE: PRODUCT BACKLOG (EXTENSIONS)
# -------------------------------------------------------------
backlog_headers = ['No.', 'Feature / Activity', 'Sprint No.', 'Review Outcome']
backlog_widths = [50, 310, 110, 530]
backlog_rows = [
    ('15', 'Physical Handover & Return Protocol', 'Sprint 5', '6-digit Pickup PIN and Return PIN flow with inspection photos verified.'),
    ('16', 'Deposit Damage Dispute Tribunal', 'Sprint 5', 'Host claim filing, renter rebuttal, and binding admin arbitration deployed.'),
    ('17', 'Smart Pricing & Duration Discounts', 'Sprint 5', 'Weekend rates, weekly/monthly tiered discounts & quote API operational.'),
    ('18', 'Administrative Analytics Dashboard', 'Sprint 5', 'Live MongoDB metrics, Catmull-Rom SVG spline charts & demand share active.'),
    ('19', 'Verified Reviews & Star Rating System', 'Sprint 5', 'Post-rental feedback collection and listing star aggregates functional.')
]
render_general_table(
    'PRODUCT BACKLOG – SPRINT 5 EXTENSIONS',
    'Sprint backlog extensions capturing completed roadmap modules and evaluation deliverables.',
    backlog_headers,
    backlog_rows,
    backlog_widths,
    'pdf_assets/table_product_backlog.png'
)

# Copy all rendered files into the artifact directory for visual embedding
generated_files = [
    'schema_2_listings.png',
    'schema_4_bookings.png',
    'schema_5_payments.png',
    'schema_9_disputes.png',
    'schema_11_reports.png',
    'table_testing_and_validation.png',
    'table_github_version_history.png',
    'table_product_backlog.png'
]
for fname in generated_files:
    src = os.path.join('pdf_assets', fname)
    dst = os.path.join(artifact_dir, fname)
    shutil.copy2(src, dst)
    print(f'Copied to artifact directory: {dst}')

print('All 8 table images generated and synchronized successfully!')
