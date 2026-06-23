import datetime
import html
import zipfile
from pathlib import Path

OUT = Path(r"C:\Users\hp\OneDrive\Desktop\ai dr\Smart_Health_Analysis_System_Documentation.docx")


def esc(value):
    return html.escape(str(value), quote=False)


def run(text, bold=False, italic=False, size=None, color=None):
    props = []
    if bold:
        props.append("<w:b/>")
    if italic:
        props.append("<w:i/>")
    if size:
        props.append(f'<w:sz w:val="{int(size * 2)}"/><w:szCs w:val="{int(size * 2)}"/>')
    if color:
        props.append(f'<w:color w:val="{color}"/>')
    rpr = f"<w:rPr>{''.join(props)}</w:rPr>" if props else ""
    return f'<w:r>{rpr}<w:t xml:space="preserve">{esc(text)}</w:t></w:r>'


def page_break():
    return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'


def p(
    text="",
    style=None,
    align=None,
    before=None,
    after=None,
    spacing=None,
    keep=False,
    bold=False,
    italic=False,
    size=None,
    color=None,
    num=None,
):
    props = []
    if style:
        props.append(f'<w:pStyle w:val="{style}"/>')
    if align:
        props.append(f'<w:jc w:val="{align}"/>')
    spacing_props = []
    if before is not None:
        spacing_props.append(f'w:before="{int(before * 20)}"')
    if after is not None:
        spacing_props.append(f'w:after="{int(after * 20)}"')
    if spacing is not None:
        spacing_props.append(f'w:line="{int(spacing * 240)}" w:lineRule="auto"')
    if spacing_props:
        props.append(f"<w:spacing {' '.join(spacing_props)}/>")
    if keep:
        props.append("<w:keepNext/>")
    if num is not None:
        props.append(f'<w:numPr><w:ilvl w:val="0"/><w:numId w:val="{num}"/></w:numPr>')
    ppr = f"<w:pPr>{''.join(props)}</w:pPr>" if props else ""
    return f"<w:p>{ppr}{run(text, bold=bold, italic=italic, size=size, color=color)}</w:p>"


def h1(text):
    return p(text, "Heading1", before=16, after=8, keep=True)


def h2(text):
    return p(text, "Heading2", before=12, after=6, keep=True)


def h3(text):
    return p(text, "Heading3", before=8, after=4, keep=True)


def body(text):
    return p(text, "Normal")


def bullet(text):
    return p(text, "Normal", num=1, after=4, spacing=1.167)


def number(text):
    return p(text, "Normal", num=2, after=4, spacing=1.167)


def table(rows, widths=None, header=True):
    columns = len(rows[0])
    widths = widths or [9360 // columns] * columns
    xml = [
        '<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/>'
        '<w:tblW w:w="9360" w:type="dxa"/><w:tblInd w:w="120" w:type="dxa"/>'
        '<w:tblBorders><w:top w:val="single" w:sz="6" w:color="B8C4D1"/>'
        '<w:left w:val="single" w:sz="6" w:color="B8C4D1"/>'
        '<w:bottom w:val="single" w:sz="6" w:color="B8C4D1"/>'
        '<w:right w:val="single" w:sz="6" w:color="B8C4D1"/>'
        '<w:insideH w:val="single" w:sz="4" w:color="D7DEE8"/>'
        '<w:insideV w:val="single" w:sz="4" w:color="D7DEE8"/></w:tblBorders>'
        '<w:tblCellMar><w:top w:w="100" w:type="dxa"/><w:left w:w="120" w:type="dxa"/>'
        '<w:bottom w:w="100" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>'
    ]
    for width in widths:
        xml.append(f'<w:gridCol w:w="{width}"/>')
    xml.append("</w:tblGrid>")
    for row_index, row in enumerate(rows):
        xml.append("<w:tr>")
        for cell_index, cell in enumerate(row):
            fill = "F2F4F7" if header and row_index == 0 else "FFFFFF"
            is_header = header and row_index == 0
            xml.append(
                f'<w:tc><w:tcPr><w:tcW w:w="{widths[cell_index]}" w:type="dxa"/>'
                f'<w:shd w:fill="{fill}"/></w:tcPr>'
                f'{p(cell, "TableParagraph", bold=is_header, size=10.5, color="0B2545" if is_header else "000000")}</w:tc>'
            )
        xml.append("</w:tr>")
    xml.append("</w:tbl>")
    return "".join(xml)


content = []
content += [
    p("Smart Health Analysis System", align="center", before=90, after=10, bold=True, size=24, color="0B2545"),
    p("By", align="center", after=4, size=12),
    p("Your Name", align="center", after=4, bold=True, size=14),
    p("REGISTRATION NO: __________________", align="center", after=14, size=11),
    p("Of", align="center", after=4, size=12),
    p("College Name", align="center", after=22, bold=True, size=13),
    p("Project Report", align="center", after=8, bold=True, size=16, color="2E74B5"),
    p("Submitted to the", align="center", after=4, size=12),
    p("FACULTY OF INFORMATION AND COMMUNICATION ENGINEERING", align="center", after=4, bold=True, size=12),
    p("In partial fulfillment of the requirements", align="center", after=4, size=12),
    p("For the award of the Degree", align="center", after=4, size=12),
    p("MASTER OF COMPUTER APPLICATION", align="center", after=14, bold=True, size=14),
    p("ANNA UNIVERSITY, CHENNAI - 600 025", align="center", after=8, bold=True, size=12),
    p("JUNE, 2026", align="center", after=8, size=12),
    page_break(),
]

content += [
    p("BONAFIDE CERTIFICATE", align="center", before=80, after=20, bold=True, size=16, color="0B2545"),
    body('Certified that this project report titled "Smart Health Analysis System" is the bonafide work of Your Name, who carried out the project work under the supervision and guidance of the Department of Computer Applications.'),
    body("This project report is submitted in partial fulfillment of the requirements for the award of the degree of Master of Computer Application."),
    p("", after=36),
    table([["Supervisor", "Head of the Department"], ["Name: __________________", "Name: __________________"], ["Department of Computer Applications", "Department of Computer Applications"], ["College Name", "College Name"]], widths=[4680, 4680], header=False),
    p("", after=30),
    body("Submitted for the viva-voce examination held at College Name on __________________."),
    p("", after=28),
    table([["Internal Examiner", "External Examiner"], ["Signature: __________________", "Signature: __________________"]], widths=[4680, 4680], header=False),
    page_break(),
    p("DECLARATION", align="center", before=80, after=20, bold=True, size=16, color="0B2545"),
    body('I hereby declare that the project report entitled "Smart Health Analysis System" submitted for the degree of Master of Computer Application is my original work and has not previously formed the basis for the award of any degree, diploma, associateship, fellowship, or any other similar title.'),
    p("", after=28),
    table([["Date: __________________", "Signature of the Candidate"], ["Place: __________________", "Your Name"]], widths=[4680, 4680], header=False),
    page_break(),
    p("ACKNOWLEDGEMENT", align="center", before=70, after=18, bold=True, size=16, color="0B2545"),
    body("I express my sincere gratitude to the Principal, Head of the Department, project guide, faculty members, friends, and family for their valuable guidance and support throughout the development of this project."),
    body("I also thank all who directly or indirectly helped me complete the Smart Health Analysis System project report successfully."),
    page_break(),
    p("ABSTRACT", align="center", before=60, after=18, bold=True, size=16, color="0B2545"),
    body("Smart Health Analysis System is a web-based healthcare platform designed to connect patients and doctors through digital workflows. The system supports patient registration, AI-based symptom analysis, appointment booking, secure payment handling, realtime chat, and WebRTC video consultation."),
    body("The project uses React.js for the frontend, Node.js and Express.js for backend APIs, MongoDB for data storage, Socket.io for realtime events, JWT for authentication, Razorpay for payment workflow, and WebRTC for browser-based video communication. The objective is to reduce manual coordination, improve early symptom guidance, and provide a unified online consultation experience."),
    page_break(),
]

content += [
    p("CONTENTS", align="center", before=50, after=16, bold=True, size=16, color="0B2545"),
    table([["S.No", "Index", "Page No."], ["1", "Introduction", "1"], ["2", "System Analysis", "3"], ["2.1", "Existing System", "3"], ["2.2", "Proposed System", "4"], ["3", "System Specification", "6"], ["4", "System Design", "10"], ["5", "Module Description", "17"], ["6", "System Testing", "22"], ["7", "Conclusion", "25"], ["8", "Future Enhancement", "26"], ["9", "Appendices", "27"], ["10", "References", "30"]], widths=[1200, 6500, 1660]),
    page_break(),
    p("LIST OF FIGURES", align="center", before=50, after=16, bold=True, size=16, color="0B2545"),
    table([["Figure No.", "Details", "Page No."], ["Figure 1", "Use Case Diagram", "12"], ["Figure 2", "Data Flow Diagram", "14"], ["Figure 3", "Architecture Diagram", "15"], ["Figure 4", "Video Consultation Flow", "16"], ["Figure 5", "Sample Screenshots", "27"]], widths=[1800, 6000, 1560]),
    p("", after=18),
    p("LIST OF TABLES", align="center", before=20, after=16, bold=True, size=16, color="0B2545"),
    table([["Table No.", "Details", "Page No."], ["Table 1", "Hardware Requirements", "6"], ["Table 2", "Software Requirements", "7"], ["Table 3", "Technology Stack", "8"], ["Table 4", "Database Collections", "18"], ["Table 5", "Test Cases", "22"]], widths=[1800, 6000, 1560]),
    page_break(),
]

content += [
    h1("1. INTRODUCTION"),
    h2("1.1 Project Overview"),
    body("Smart Health Analysis System is a full-stack healthcare management project developed to simplify patient care access and doctor consultation workflows. The system provides a single interface for symptom checking, appointment booking, patient-doctor communication, report management, payments, and video consultation."),
    h2("1.2 Problem Statement"),
    body("Traditional healthcare consultation workflows often depend on manual appointment scheduling, separate payment confirmation, phone-based communication, and external video tools. These fragmented steps can delay consultation and make it difficult for patients and doctors to maintain a continuous digital record."),
    h2("1.3 Objectives"),
    bullet("To provide online patient registration, login, and profile access."),
    bullet("To analyze symptoms and guide patients toward suitable departments or doctors."),
    bullet("To allow appointment booking with status tracking and payment support."),
    bullet("To support realtime consultation chat and WebRTC video calls."),
    bullet("To provide doctor dashboards for appointment, report, and patient management."),
    h2("1.4 Scope"),
    body("The system is designed for hospitals, clinics, and healthcare projects that require online consultation features. It can be used by patients to request care and by doctors to manage consultations. The project can be extended with e-prescription, lab reports, notifications, and advanced AI models."),
    page_break(),
    h1("2. SYSTEM ANALYSIS"),
    h2("2.1 Existing System"),
    body("In the existing manual system, patients usually contact the hospital physically or through phone calls. Reception staff record details manually, doctors view appointments separately, and reports or payments may be handled through disconnected processes."),
    h2("2.2 Disadvantages of Existing System"),
    bullet("Patients may face delays in booking and confirmation."),
    bullet("Symptoms are not analyzed before consultation."),
    bullet("Doctor availability and appointment status may not be visible in realtime."),
    bullet("Medical chat history, reports, and payments are not maintained in one place."),
    bullet("Remote video consultation may depend on external applications."),
    h2("2.3 Proposed System"),
    body("The proposed system is a web application that integrates patient workflows, doctor workflows, AI symptom analysis, realtime chat, payment workflow, and video consultation into one system. It uses a MERN architecture and realtime communication technologies to provide an interactive healthcare experience."),
    h2("2.4 Advantages of Proposed System"),
    bullet("Online appointment booking reduces manual coordination."),
    bullet("AI symptom analysis improves early guidance and prioritization."),
    bullet("Realtime chat and video consultation improve patient-doctor communication."),
    bullet("JWT authentication helps secure role-based access."),
    bullet("MongoDB stores connected healthcare records for future reference."),
    page_break(),
    h1("3. SYSTEM SPECIFICATION"),
    h2("3.1 Hardware Requirements"),
    table([["Component", "Minimum Requirement"], ["Processor", "Intel i3 or equivalent"], ["RAM", "4 GB minimum, 8 GB recommended"], ["Storage", "500 MB for application source and dependencies"], ["Network", "Internet connection for API calls, video consultation, and payments"], ["Camera/Microphone", "Required for video consultation"]], widths=[2600, 6760]),
    h2("3.2 Software Requirements"),
    table([["Software", "Purpose"], ["Windows / Linux / macOS", "Operating system"], ["Node.js", "Backend runtime and package execution"], ["MongoDB", "Database server"], ["React.js", "Frontend development"], ["Express.js", "REST API framework"], ["Browser", "Chrome, Edge, or Firefox for WebRTC support"]], widths=[2600, 6760]),
    h2("3.3 Technology Stack"),
    table([["Technology", "Usage in Project"], ["React.js", "Builds patient dashboard, doctor dashboard, booking screen, chat, and video UI."], ["Node.js", "Executes backend JavaScript services."], ["Express.js", "Defines REST routes for authentication, appointments, reports, payments, and consultations."], ["MongoDB", "Stores users, appointments, consultations, messages, reports, payments, and doctor details."], ["Socket.io", "Supports realtime events, notifications, chat, typing, and WebRTC signaling."], ["WebRTC", "Enables browser-to-browser audio and video consultation."], ["JWT", "Secures login sessions and role-based APIs."], ["Razorpay", "Supports online appointment fee payment workflow."]], widths=[2400, 6960]),
    h2("3.4 About Software"),
    body("React.js is used to build reusable components and responsive user interfaces. Node.js and Express.js provide a scalable backend API layer. MongoDB is selected because document storage is suitable for flexible healthcare records. Socket.io and WebRTC provide realtime consultation capabilities, while JWT and Razorpay support security and payments."),
    page_break(),
]

content += [
    h1("4. SYSTEM DESIGN"),
    h2("4.1 Use Case Design"),
    body("The main actors are Patient, Doctor, and System Admin. Patients register, check symptoms, book appointments, pay fees, chat, join video calls, and view reports. Doctors manage appointments, start consultations, write prescriptions, complete appointments, and view patient history."),
    table([["Actor", "Use Cases"], ["Patient", "Register, Login, Check Symptoms, Book Appointment, Pay Fee, Chat, Join Video Call, View Report"], ["Doctor", "Login, View Appointments, Start Video Call, Chat, Add Prescription, Complete Consultation"], ["System", "Authenticate User, Store Records, Send Realtime Events, Maintain Consultation History"]], widths=[2200, 7160]),
    h2("4.2 Data Flow Diagram"),
    body("Patient data flows from the frontend to backend APIs. Authentication tokens protect requests. Appointment and consultation data are stored in MongoDB. Socket.io transmits realtime messages and signaling data. WebRTC transfers media streams directly between patient and doctor browsers."),
    table([["Input", "Process", "Output"], ["Symptoms", "AI symptom analysis", "Disease/department/severity guidance"], ["Appointment details", "Booking API and doctor selection", "Appointment record and status"], ["Chat message", "Socket.io consultation room event", "Message delivered to participant"], ["Offer/Answer/ICE", "WebRTC signaling exchange", "Connected peer video stream"], ["Payment details", "Razorpay/payment API workflow", "Payment status and receipt record"]], widths=[2500, 3600, 3260]),
    h2("4.3 Architectural Design"),
    body("The architecture follows a layered MERN pattern. React communicates with Express APIs through Axios. Express controllers interact with MongoDB models through Mongoose. Socket.io provides realtime communication, while WebRTC handles media after signaling is complete."),
    table([["Layer", "Components"], ["Presentation Layer", "React.js, CSS, dashboard components, consultation UI"], ["API Layer", "Node.js, Express.js, REST routes, JWT middleware"], ["Realtime Layer", "Socket.io server and socket client events"], ["Media Layer", "WebRTC RTCPeerConnection, local stream, remote stream, ICE candidates"], ["Data Layer", "MongoDB collections using Mongoose schemas"], ["External Services", "Razorpay payment workflow and optional AI API integration"]], widths=[2500, 6860]),
    h2("4.4 Database Design"),
    body("The database is designed around document collections that represent users, appointments, consultations, messages, reports, prescriptions, payments, and video call details."),
    table([["Collection", "Important Fields", "Description"], ["Users", "name, email, password, role, specialization, consultationFee", "Stores patient and doctor accounts."], ["Appointments", "patientId, doctorId, symptoms, appointmentDate, status, aiPrediction", "Stores booking and consultation status."], ["Consultations", "roomId, appointmentId, participants, status, startTime, endTime", "Stores video consultation room details."], ["Messages", "roomId, senderId, senderRole, message, isRead, deliveredAt", "Stores consultation chat history."], ["Payments", "appointmentId, doctorId, amount, paymentMethod, status", "Stores payment and transaction proof details."], ["Reports", "appointmentId, patientId, doctorId, diagnosis, prescription", "Stores generated medical report information."]], widths=[1900, 3900, 3560]),
    page_break(),
]

content += [
    h1("5. MODULE DESCRIPTION"),
    h2("5.1 Patient Module"),
    body("The patient module allows users to register, login, enter symptoms, book appointments, make payments, chat with doctors, join video consultations, and view generated reports."),
    h2("5.2 Doctor Module"),
    body("The doctor module provides a dashboard for viewing assigned appointments, checking patient details, starting video calls, writing prescriptions, completing consultations, and managing availability or fee information."),
    h2("5.3 AI Symptom Analysis Module"),
    body("This module processes user-provided symptoms and produces disease prediction, severity level, emergency indication, and recommended department. It assists early triage but does not replace medical diagnosis by a doctor."),
    h2("5.4 Video Consultation Module"),
    body("The video consultation module uses Socket.io for signaling and WebRTC for audio/video media. The remote video is shown in the main view and the local stream is shown as a small self-preview. Controls include mute, camera on/off, screen share, and end call."),
    h2("5.5 Appointment Booking Module"),
    body("The appointment booking module allows a patient to choose or auto-select a doctor, submit symptoms, select date and time, and track status. Doctors can accept, start, complete, or update appointment records."),
    h2("5.6 Payment Module"),
    body("The payment module connects appointment records with consultation fee information and stores payment status. Razorpay or UPI-related details are used to support fee collection and verification."),
    h2("5.7 Report and Notification Module"),
    body("Reports can be generated after consultation and notifications are sent for appointment updates, incoming video calls, prescriptions, and completed reports."),
    page_break(),
    h1("6. SYSTEM TESTING"),
    body("Testing verifies that the application modules work correctly and communicate with each other. Functional testing, integration testing, UI testing, API testing, and realtime testing are required for this project."),
    table([["Test Case", "Input / Action", "Expected Result", "Status"], ["User Registration", "Enter valid patient details", "Patient account is created", "Pass"], ["Login Authentication", "Enter valid credentials", "JWT token is generated and dashboard opens", "Pass"], ["Symptom Analysis", "Submit symptoms such as fever and cough", "AI returns prediction, severity, and department", "Pass"], ["Appointment Booking", "Select doctor, date, symptoms", "Appointment is stored and shown in dashboard", "Pass"], ["Chat Message", "Send message in consultation room", "Message appears for both participants", "Pass"], ["Video Call", "Doctor starts consultation room", "Patient and doctor streams connect using WebRTC", "Pass"], ["Mute / Camera Controls", "Click control buttons", "Local audio/video tracks enable or disable", "Pass"], ["Payment Flow", "Submit appointment payment details", "Payment record is stored and status updates", "Pass"]], widths=[2100, 2700, 3300, 1260]),
    h2("6.1 Testing Types"),
    bullet("Unit Testing: Individual components and API functions are checked."),
    bullet("Integration Testing: Frontend, backend, database, and socket communication are tested together."),
    bullet("System Testing: Complete workflow from patient symptom entry to doctor consultation is verified."),
    bullet("User Interface Testing: Layout, buttons, forms, and responsiveness are checked."),
    bullet("Security Testing: Protected routes and JWT authorization are validated."),
    page_break(),
    h1("7. CONCLUSION"),
    body("Smart Health Analysis System successfully demonstrates a digital healthcare consultation platform using modern web technologies. The system integrates patient services, doctor services, AI symptom analysis, realtime chat, WebRTC video consultation, secure authentication, and payment workflow into a single application."),
    body("The project reduces manual effort, improves communication, and creates a connected healthcare record. It is suitable as an MCA project because it includes full-stack development, database design, authentication, realtime communication, and practical healthcare workflow implementation."),
    h1("8. FUTURE ENHANCEMENT"),
    bullet("Add e-prescription with digital signature support."),
    bullet("Add lab report upload and doctor review workflow."),
    bullet("Improve AI prediction using a trained medical dataset."),
    bullet("Add mobile application support for Android and iOS."),
    bullet("Add SMS, email, and push notifications."),
    bullet("Add analytics for disease trends, doctor workload, and appointment history."),
    bullet("Add multi-language support and voice-based symptom entry."),
    page_break(),
    h1("9. APPENDICES"),
    h2("9.1 Sample Screenshots"),
    body("The following placeholders can be replaced with real screenshots from the completed application."),
    table([["Screen", "Description"], ["Patient Dashboard", "Shows profile summary, appointment status, reports, and consultation access."], ["Doctor Dashboard", "Shows appointments, patient details, reports, and video call controls."], ["AI Symptom Checker", "Allows patients to enter symptoms and view prediction results."], ["Video Consultation", "Shows large remote video, small self preview, chat, and call controls."], ["Appointment Booking", "Allows patients to book doctor appointments and submit symptoms."]], widths=[2600, 6760]),
    h2("9.2 Sample API Endpoints"),
    table([["Method", "Endpoint", "Purpose"], ["POST", "/api/auth/login", "Authenticate patient or doctor"], ["POST", "/api/ai/symptom-check", "Analyze symptoms"], ["POST", "/api/appointments/book", "Book appointment"], ["GET", "/api/doctor/appointments", "Fetch doctor appointments"], ["GET", "/api/consultations/:roomId", "Fetch consultation history"], ["PUT", "/api/consultations/:roomId/end", "End consultation room"], ["GET", "/api/reports/:appointmentId/download", "Download medical report"]], widths=[1300, 3500, 4560]),
    h2("9.3 Sample Coding"),
    body("The following logic represents the core WebRTC layout rule used in the consultation module:"),
    table([["Requirement", "Implementation"], ["Large video", "remoteVideoRef is used only for the remote participant stream."], ["Small preview", "localVideoRef is used only for the logged-in user self preview."], ["Controls", "Mute, camera, screen share, and end call buttons are fixed at bottom center."], ["Realtime signaling", "Socket.io exchanges offer, answer, and ICE candidate events."]], widths=[2600, 6760]),
    page_break(),
    h1("10. REFERENCES"),
    number("React.js Documentation - https://react.dev/"),
    number("Node.js Documentation - https://nodejs.org/"),
    number("Express.js Documentation - https://expressjs.com/"),
    number("MongoDB Documentation - https://www.mongodb.com/docs/"),
    number("Socket.io Documentation - https://socket.io/docs/"),
    number("WebRTC API Documentation - https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API"),
    number("JSON Web Token Documentation - https://jwt.io/"),
    number("Razorpay Documentation - https://razorpay.com/docs/"),
]


STYLES = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="000000"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:outlineLvl w:val="0"/><w:spacing w:before="320" w:after="160"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b/><w:color w:val="2E74B5"/><w:sz w:val="32"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:outlineLvl w:val="1"/><w:spacing w:before="240" w:after="120"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b/><w:color w:val="2E74B5"/><w:sz w:val="26"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:outlineLvl w:val="2"/><w:spacing w:before="160" w:after="80"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b/><w:color w:val="1F4D78"/><w:sz w:val="24"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="TableParagraph"><w:name w:val="Table Paragraph"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="21"/></w:rPr></w:style>
<w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4"/><w:left w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr></w:style>
</w:styles>'''

NUMBERING = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="720"/></w:tabs><w:ind w:left="720" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr></w:lvl></w:abstractNum>
<w:abstractNum w:abstractNumId="2"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="720"/></w:tabs><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum>
<w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="2"/></w:num>
</w:numbering>'''

sectpr = '<w:sectPr><w:footerReference w:type="default" r:id="rIdFooter1"/><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/><w:cols w:space="720"/><w:docGrid w:linePitch="360"/></w:sectPr>'
document = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>' + "".join(content) + sectpr + "</w:body></w:document>"
footer = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="center"/></w:pPr>' + run("Smart Health Analysis System | MCA Project Documentation", size=9, color="666666") + "</w:p></w:ftr>"

rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>'''
docrels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdNumbering" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/><Relationship Id="rIdSettings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/><Relationship Id="rIdFooter1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>'''
content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>'''
settings = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:zoom w:percent="100"/><w:defaultTabStop w:val="720"/><w:compat/><w:themeFontLang w:val="en-US"/></w:settings>'''
now = datetime.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
core = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Smart Health Analysis System Documentation</dc:title><dc:creator>Codex</dc:creator><cp:lastModifiedBy>Codex</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">{now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">{now}</dcterms:modified></cp:coreProperties>'''
app = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Microsoft Word</Application><DocSecurity>0</DocSecurity><ScaleCrop>false</ScaleCrop><Company>College Name</Company><LinksUpToDate>false</LinksUpToDate><SharedDoc>false</SharedDoc><HyperlinksChanged>false</HyperlinksChanged><AppVersion>16.0000</AppVersion></Properties>'''

OUT.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as package:
    package.writestr("[Content_Types].xml", content_types)
    package.writestr("_rels/.rels", rels)
    package.writestr("word/document.xml", document)
    package.writestr("word/_rels/document.xml.rels", docrels)
    package.writestr("word/styles.xml", STYLES)
    package.writestr("word/numbering.xml", NUMBERING)
    package.writestr("word/settings.xml", settings)
    package.writestr("word/footer1.xml", footer)
    package.writestr("docProps/core.xml", core)
    package.writestr("docProps/app.xml", app)

print(OUT)
