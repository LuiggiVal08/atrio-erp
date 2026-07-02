import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';

@Injectable()
export class CsvGeneratorService {
  async generate(
    _templateName: string,
    data: { headers: string[]; rows: Record<string, any>[] },
  ): Promise<Buffer> {
    const escape = (val: unknown): string => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headerLine = data.headers.join(',');
    const rowLines = data.rows.map((row) =>
      data.headers.map((h) => escape(row[h])).join(','),
    );
    const csv = [headerLine, ...rowLines].join('\n');

    return Buffer.from(csv, 'utf-8');
  }
}
