from flask import Blueprint, request, jsonify, send_file
from io import BytesIO
import pandas as pd
from models import Case, Protocolist, CaseFinished
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

report_bp = Blueprint('report', __name__)

@report_bp.route('/report', methods=['POST'])
def generate_report():
    try:
        # Obtener datos del frontend
        data = request.json
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        report_type = data.get('report_type')  # Formato: 'excel' o 'pdf'
        protocolista_id = data.get('protocolista_id')  # ID o 0 para todos
        case_type = data.get('case_type')  # Tipo de casos: 'pending', 'finished', 'all'

        print(f"Generando reporte: Rango de fechas: {start_date} - {end_date}, Reporte: {report_type}, Protocolista ID: {protocolista_id}, Casos: {case_type}")

        # Determinar si se genera para todos los protocolistas o uno específico
        if protocolista_id is None or protocolista_id == 0:
            protocolistas = Protocolist.query.all()  # Todos los protocolistas
            file_name = f"reporte_general_{start_date}_al_{end_date}"
        else:
            protocolistas = [Protocolist.query.get(protocolista_id)]
            protocolista_name = protocolistas[0].nombre.replace(" ", "_")
            file_name = f"{case_type}_{protocolista_name}_{start_date}_al_{end_date}"

        # Preparar los datos de todos los protocolistas
        all_cases = []
        for protocolista in protocolistas:
            protocolista_id = protocolista.id
            protocolista_name = protocolista.nombre

            # Filtrar casos según el tipo
            if case_type == 'pending':
                cases = Case.query.filter(
                    Case.fecha >= start_date,
                    Case.fecha <= end_date,
                    Case.protocolista_id == protocolista_id
                ).all()
            elif case_type == 'finished':
                cases = CaseFinished.query.filter(
                    CaseFinished.fecha >= start_date,
                    CaseFinished.fecha <= end_date,
                    CaseFinished.protocolista == protocolista_name
                ).all()
            else:  # Todos los casos
                pending_cases = Case.query.filter(
                    Case.fecha >= start_date,
                    Case.fecha <= end_date,
                    Case.protocolista_id == protocolista_id
                ).all()
                finished_cases = CaseFinished.query.filter(
                    CaseFinished.fecha >= start_date,
                    CaseFinished.fecha <= end_date,
                    CaseFinished.protocolista == protocolista_name
                ).all()
                cases = pending_cases + finished_cases

            # Formatear los datos para el reporte
            case_list = [{
                'Fecha': case.fecha,
                'Escritura': case.escritura,
                'Radicado': case.radicado,
                'Protocolista': protocolista_name,
                'Observaciones': case.observaciones,
                'Fecha del Documento': case.fecha_documento
            } for case in cases]

            all_cases.extend(case_list)

        # Generar el archivo de reporte
        if report_type == 'excel':
            df = pd.DataFrame(all_cases)
            output = BytesIO()
            with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                df.to_excel(writer, index=False, sheet_name="Reporte General")
            output.seek(0)
            return send_file(output, as_attachment=True, download_name=f'{file_name}.xlsx', mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

        elif report_type == 'pdf':
            output = BytesIO()
            pdf = canvas.Canvas(output, pagesize=letter)
            pdf.drawString(100, 750, f"Reporte de Casos ({start_date} a {end_date})")
            y = 700
            for case in all_cases:
                pdf.drawString(100, y, f"Fecha: {case['Fecha']}, Escritura: {case['Escritura']}, Radicado: {case['Radicado']}, Protocolista: {case['Protocolista']}")
                pdf.drawString(100, y-20, f"Observaciones: {case['Observaciones']}, Fecha del Documento: {case['Fecha del Documento']}")
                y -= 40
                if y < 100:  # Crear nueva página si es necesario
                    pdf.showPage()
                    y = 750
            pdf.save()
            output.seek(0)
            return send_file(output, as_attachment=True, download_name=f'{file_name}.pdf', mimetype='application/pdf')

        return jsonify({'error': 'Formato de reporte no soportado'}), 400

    except Exception as e:
        print(f"Error generando el informe: {e}")
        return jsonify({'message': 'Error generando el informe', 'error': str(e)}), 500
