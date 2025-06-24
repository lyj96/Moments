import { NextRequest } from 'next/server';

export interface ParsedFormData {
  fields: { [key: string]: string | string[] };
  files: { [key: string]: File | File[] };
}

export async function parseFormData(request: NextRequest): Promise<ParsedFormData> {
  const formData = await request.formData();
  
  const fields: { [key: string]: string | string[] } = {};
  const files: { [key: string]: File | File[] } = {};
  
  const entries = Array.from(formData.entries());
  
  for (const [key, value] of entries) {
    if (value instanceof File) {
      if (files[key]) {
        if (Array.isArray(files[key])) {
          (files[key] as File[]).push(value);
        } else {
          files[key] = [files[key] as File, value];
        }
      } else {
        files[key] = value;
      }
    } else {
      if (fields[key]) {
        if (Array.isArray(fields[key])) {
          (fields[key] as string[]).push(value);
        } else {
          fields[key] = [fields[key] as string, value];
        }
      } else {
        fields[key] = value;
      }
    }
  }
  
  return { fields, files };
} 