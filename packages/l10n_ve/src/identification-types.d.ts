export interface IdentificationTypeDef {
    code: string;
    label: string;
    country: 'VE';
    mask: string;
    pattern: RegExp;
    format(raw: string): string;
    unformat(formatted: string): string;
}
export declare const IDENTIFICATION_TYPES_VE: IdentificationTypeDef[];
export declare function findByIdentificationType(code: string): IdentificationTypeDef | undefined;
