"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDENTIFICATION_TYPES_VE = void 0;
exports.findByIdentificationType = findByIdentificationType;
const DIGITS_3_SEP = (v) => {
    const d = v.replace(/\D/g, '');
    return d.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};
exports.IDENTIFICATION_TYPES_VE = [
    {
        code: 'CI_VE',
        label: 'Cédula de Identidad (V-)',
        country: 'VE',
        mask: '#.###.###',
        pattern: /^V?\d{6,8}$/i,
        format(raw) {
            const cleaned = raw.replace(/[^Vv\d]/g, '').toUpperCase();
            if (!cleaned)
                return '';
            const prefix = cleaned.startsWith('V') ? 'V-' : '';
            const digits = cleaned.replace(/V/i, '');
            return prefix + DIGITS_3_SEP(digits);
        },
        unformat(formatted) {
            return formatted.replace(/[^\dV]/gi, '').toUpperCase();
        },
    },
    {
        code: 'RIF_VE',
        label: 'RIF (J-###.###.###-#)',
        country: 'VE',
        mask: 'F-###.###.###-#',
        pattern: /^[VEJGP]\d{8,9}$/i,
        format(raw) {
            const cleaned = raw.replace(/[^\w\d]/g, '').toUpperCase();
            if (!cleaned)
                return '';
            const letter = cleaned.match(/^[VEJGP]/i)?.[0] ?? '';
            const rest = cleaned.replace(/^[VEJGP]/i, '').replace(/\D/g, '');
            if (!rest)
                return letter;
            let formatted = DIGITS_3_SEP(rest.slice(0, -1));
            if (rest.length > 1) {
                const checkDigit = rest.slice(-1);
                formatted = letter + '-' + formatted + '-' + checkDigit;
            }
            else {
                formatted = letter + '-' + formatted;
            }
            return formatted;
        },
        unformat(formatted) {
            return formatted.replace(/[^\w\d]/g, '').toUpperCase();
        },
    },
    {
        code: 'PASS_VE',
        label: 'Pasaporte',
        country: 'VE',
        mask: 'AAAA######',
        pattern: /^[A-Za-z]{2,}\d{4,}$/,
        format(raw) {
            return raw.toUpperCase();
        },
        unformat(formatted) {
            return formatted.toUpperCase();
        },
    },
];
function findByIdentificationType(code) {
    return exports.IDENTIFICATION_TYPES_VE.find((t) => t.code === code);
}
//# sourceMappingURL=identification-types.js.map