from flask import Blueprint, request, jsonify, send_file
from io import BytesIO
import pandas as pd
from models import Case, Protocolist, CaseFinished

report_bp = Blueprint('report', __name__)

@report_bp.route('/report', methods=['POST'])
def generate_report():
    try:
        print("Datos recibidos del frontend:", request.json)

        data = request.json
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        report_type = data.get('report_type')
        protocolista_id = data.get('protocolista_id')
        case_type = data.get('case_type')

        print(f"Rango de fechas: {start_date} a {end_date}, Tipo de reporte: {report_type}, Protocolista ID: {protocolista_id}, Tipo de casos: {case_type}")

        # Obtener el nombre del protocolista
        protocolista = Protocolist.query.get(protocolista_id).nombre

        # Generar un nombre de archivo dinámico según el tipo de informe y protocolista
        if case_type == 'pending':
            case_type_name = 'casos_pendientes'
        elif case_type == 'finished':
            case_type_name = 'casos_finalizados'
        else:
            case_type_name = 'informe_completo'

        # Limpia el nombre del protocolista eliminando caracteres no válidos
        protocolista_cleaned = protocolista.replace(" ", "_")

        # Nombre del archivo con tipo de informe y protocolista
        file_name = f"{case_type_name}_{protocolista_cleaned}_{start_date}_al_{end_date}"

        # Caso 1: Solo casos pendientes
        if case_type == 'pending':
            cases = Case.query.filter(
                Case.fecha >= start_date,
                Case.fecha <= end_date,
                Case.protocolista_id == protocolista_id
            ).all()

            case_list = [{
                'Fecha': case.fecha,
                'Escritura': case.escritura,
                'Radicado': case.radicado,
                'Protocolista': Protocolist.query.get(case.protocolista_id).nombre,
                'Observaciones': case.observaciones,
                'Fecha del Documento': case.fecha_documento
            } for case in cases]

        # Caso 2: Solo casos finalizados
        elif case_type == 'finished':
            cases = CaseFinished.query.filter(
                CaseFinished.fecha >= start_date,
                CaseFinished.fecha <= end_date,
                CaseFinished.protocolista == protocolista
            ).all()

            case_list = [{
                'Fecha': case.fecha,
                'Escritura': case.escritura,
                'Radicado': case.radicado,
                'Protocolista': case.protocolista,
                'Observaciones': case.observaciones,
                'Fecha del Documento': case.fecha_documento,
                'Envíos': case.envios
            } for case in cases]

        # Caso 3: Ambos tipos de casos (Pendientes y finalizados)
        else:
            pending_cases = Case.query.filter(
                Case.fecha >= start_date,
                Case.fecha <= end_date,
                Case.protocolista_id == protocolista_id
            ).all()

            finished_cases = CaseFinished.query.filter(
                CaseFinished.fecha >= start_date,
                CaseFinished.fecha <= end_date,
                CaseFinished.protocolista == protocolista
            ).all()

            # Combina ambos tipos de casos
            case_list = [{
                'Fecha': case.fecha,
                'Escritura': case.escritura,
                'Radicado': case.radicado,
                'Protocolista': Protocolist.query.get(case.protocolista_id).nombre,
                'Observaciones': case.observaciones,
                'Fecha del Documento': case.fecha_documento
            } for case in pending_cases]

            case_list += [{
                'Fecha': case.fecha,
                'Escritura': case.escritura,
                'Radicado': case.radicado,
                'Protocolista': case.protocolista,
                'Observaciones': case.observaciones,
                'Fecha del Documento': case.fecha_documento,
                'Envíos': case.envios
            } for case in finished_cases]

        # Genera DataFrame con los casos combinados
        df = pd.DataFrame(case_list)

        # Generación del informe en Excel
        if report_type == 'excel':
            output = BytesIO()
            with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                df.to_excel(writer, index=False)
            output.seek(0)
            return send_file(output, as_attachment=True, download_name=f'{file_name}.xlsx', mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

        # Generación del informe en PDF
        elif report_type == 'pdf':
            from reportlab.lib.pagesizes import letter
            from reportlab.pdfgen import canvas

            output = BytesIO()
            pdf = canvas.Canvas(output, pagesize=letter)
            pdf.drawString(100, 750, f"Reporte de Casos del {start_date} al {end_date} - {case_type_name.capitalize()}")
            
            y = 700
            for index, row in df.iterrows():
                pdf.drawString(100, y, f"Fecha: {row['Fecha']}, Escritura: {row['Escritura']}, Radicado: {row['Radicado']}, Protocolista: {row['Protocolista']}")
                pdf.drawString(100, y-20, f"Observaciones: {row['Observaciones']}, Fecha del Documento: {row['Fecha del Documento']}")
                if 'Envíos' in row:
                    pdf.drawString(100, y-40, f"Envíos: {row['Envíos']}")
                y -= 60
                if y < 100:
                    pdf.showPage()
                    y = 750
            
            pdf.save()
            output.seek(0)
            return send_file(output, as_attachment=True, download_name=f'{file_name}.pdf', mimetype='application/pdf')

        return jsonify({'message': 'Error: Formato de reporte no soportado'}), 400

    except Exception as e:
        print(f"Error generando el informe: {e}")
        return jsonify({'message': 'Error generando el informe', 'error': str(e)}), 500

