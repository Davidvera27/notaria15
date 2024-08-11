import fitz  # PyMuPDF
import re

def extract_pdf_data(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()

    clase = extract_field(text, "CLASE")
    radicado = extract_field(text, "RADICADO N°")
    doc_number = extract_field(text, "N° DOC")

    print(f"Extracted data from {pdf_path}: CLASE={clase}, RADICADO N°={radicado}, N° DOC={doc_number}")

    return {
        "CLASE": clase,
        "RADICADO N°": radicado,
        "N° DOC": doc_number
    }

def extract_field(text, field_name):
    pattern = rf"{field_name}\s*([\d\-]+)"
    match = re.search(pattern, text)
    if match:
        return match.group(1).strip()
    return "No encontrado"
