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
  const csv = [headers, ...rows].map((row) => row.map(cell).join(',')).join('\r\n');
  saveBlob(filename.endsWith('.csv') ? filename : `${filename}.csv`, new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }));
}

export function downloadExcel(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const xmlCell = (value: string | number | null | undefined) =>
    `<Cell><Data ss:Type="${typeof value === 'number' ? 'Number' : 'String'}">${String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')}</Data></Cell>`;
  const xmlRows = [headers, ...rows]
    .map((row) => `<Row>${row.map(xmlCell).join('')}</Row>`)
    .join('');
  const xml = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Report"><Table>${xmlRows}</Table></Worksheet>
</Workbook>`;
  saveBlob(filename.endsWith('.xls') ? filename : `${filename}.xls`, new Blob([xml], { type: 'application/vnd.ms-excel' }));
}
