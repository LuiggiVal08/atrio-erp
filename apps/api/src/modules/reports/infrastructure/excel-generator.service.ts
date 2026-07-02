import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExcelGeneratorService {
  async generate(
    _templateName: string,
    data: { headers: string[]; rows: Record<string, any>[] },
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Report');

    sheet.columns = data.headers.map((h) => ({ header: h, key: h, width: 20 }));

    data.rows.forEach((row) => {
      const flatRow: Record<string, any> = {};
      data.headers.forEach((h) => {
        flatRow[h] = row[h] ?? '';
      });
      sheet.addRow(flatRow);
    });

    sheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
