function saveBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function cell(value: string | number | null | undefined) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const csv = [headers, ...rows].map((row) => row.map(cell).join(';')).join('\r\n');
  saveBlob(filename.endsWith('.csv') ? filename : `${filename}.csv`, new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }));
}

function xmlEscape(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function columnWidth(header: string, rows: (string | number | null | undefined)[][], index: number) {
  let longest = header.length;
  rows.forEach((row) => {
    longest = Math.max(longest, String(row[index] ?? '').length);
  });
  return Math.min(420, Math.max(90, longest * 7 + 24));
}

export function downloadExcel(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
  sheetName = 'Report',
) {
  const xmlCell = (value: string | number | null | undefined) =>
    `<Cell><Data ss:Type="${typeof value === 'number' ? 'Number' : 'String'}">${xmlEscape(String(value ?? ''))}</Data></Cell>`;
  const cols = headers.map((h, i) => `<Column ss:AutoFitWidth="1" ss:Width="${columnWidth(h, rows, i)}"/>`).join('');
  const headerRow = `<Row>${headers.map((h) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${xmlEscape(h)}</Data></Cell>`).join('')}</Row>`;
  const xmlRows = rows.map((row) => `<Row>${row.map(xmlCell).join('')}</Row>`).join('');
  const safeSheet = sheetName.replace(/[\\/*?:[\]]/g, ' ').slice(0, 31);
  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
  <Style ss:ID="Default" ss:Name="Normal">
    <Alignment ss:Vertical="Center" ss:WrapText="0"/>
    <Font ss:FontName="Calibri" ss:Size="12"/>
  </Style>
  <Style ss:ID="Header">
    <Alignment ss:Vertical="Center" ss:WrapText="0"/>
    <Font ss:FontName="Calibri" ss:Size="12" ss:Bold="1"/>
  </Style>
</Styles>
<Worksheet ss:Name="${safeSheet}">
  <Table ss:DefaultRowHeight="18">${cols}${headerRow}${xmlRows}</Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
    <FreezePanes/>
    <FrozenNoSplit/>
    <SplitHorizontal>1</SplitHorizontal>
    <TopRowBottomPane>1</TopRowBottomPane>
  </WorksheetOptions>
</Worksheet>
</Workbook>`;
  saveBlob(filename.endsWith('.xls') ? filename : `${filename}.xls`, new Blob([xml], { type: 'application/vnd.ms-excel' }));
}
