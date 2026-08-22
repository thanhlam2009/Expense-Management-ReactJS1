# -*- coding: utf-8 -*-
"""
Kiểm thử xuất báo cáo giao dịch ra Excel (.xlsx) và CSV.
"""


def test_export_excel_requires_login(client):
    resp = client.get('/export/transactions')
    assert resp.status_code in (301, 302, 401)


def test_export_csv_requires_login(client):
    resp = client.get('/export/transactions/csv')
    assert resp.status_code in (301, 302, 401)


def test_export_excel_returns_xlsx(user_client):
    resp = user_client.get('/export/transactions')
    assert resp.status_code == 200
    assert resp.content_type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    assert resp.data[:2] == b'PK'  # file .xlsx là một gói zip, luôn bắt đầu bằng "PK"


def test_export_csv_returns_csv_with_bom_and_header(user_client):
    resp = user_client.get('/export/transactions/csv')
    assert resp.status_code == 200
    assert resp.content_type.startswith('text/csv')
    assert resp.data.startswith(b'\xef\xbb\xbf')  # BOM utf-8-sig, để Excel hiển thị đúng dấu tiếng Việt

    text = resp.data.decode('utf-8-sig')
    header_line = text.splitlines()[0]
    assert 'STT' in header_line and 'Danh mục' in header_line and 'Hóa đơn' in header_line
