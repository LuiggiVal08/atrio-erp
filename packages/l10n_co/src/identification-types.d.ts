export interface IdentificationTypeDef {
    code: string;
    label: string;
    country: 'CO';
    mask: string;
    pattern: RegExp;
    format(raw: string): string;
    unformat(formatted: string): string;
}
export declare const IDENTIFICATION_TYPES_CO: IdentificationTypeDef[];
export declare const ALL_IDENTIFICATION_TYPES: IdentificationTypeDef[];
export declare function findByIdentificationType(code: string): IdentificationTypeDef | undefined;
