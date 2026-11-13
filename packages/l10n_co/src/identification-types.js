"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_IDENTIFICATION_TYPES = exports.IDENTIFICATION_TYPES_CO = void 0;
exports.findByIdentificationType = findByIdentificationType;
const DIGITS_3_SEP = (v) => {
    const d = v.replace(/\D/g, '');
    return d.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};
exports.IDENTIFICATION_TYPES_CO = [
    {
        code: 'CC_CO',
        label: 'Cédula de Ciudadanía',
        country: 'CO',
        mask: '#.###.###.###',
        pattern: /^\d{6,10}$/,
        format(raw) {
            const digits = raw.replace(/\D/g, '');
            return DIGITS_3_SEP(digits);
        },
        unformat(formatted) {
            return formatted.replace(/\D/g, '');
        },
    },
    {
        code: 'CE_CO',
        label: 'Cédula de Extranjería',
        country: 'CO',
        mask: '#.###.###.###',
        pattern: /^\d{6,10}$/,
        format(raw) {
            const digits = raw.replace(/\D/g, '');
            return DIGITS_3_SEP(digits);
        },
        unformat(formatted) {
            return formatted.replace(/\D/g, '');
        },
    },
    {
        code: 'NIT_CO',
        label: 'NIT (###.###.###-#)',
        country: 'CO',
        mask: '###.###.###-#',
        pattern: /^\d{9,10}$/,
        format(raw) {
            const digits = raw.replace(/\D/g, '');
            if (!digits)
                return '';
            if (digits.length <= 1)
                return digits;
            let formatted = DIGITS_3_SEP(digits.slice(0, -1));
            formatted = formatted + '-' + digits.slice(-1);
            return formatted;
        },
        unformat(formatted) {
            return formatted.replace(/\D/g, '');
        },
    },
    {
        code: 'TI_CO',
        label: 'Tarjeta de Identidad',
        country: 'CO',
        mask: '#.###.###.###',
        pattern: /^\d{6,10}$/,
        format(raw) {
            const digits = raw.replace(/\D/g, '');
            return DIGITS_3_SEP(digits);
        },
        unformat(formatted) {
            return formatted.replace(/\D/g, '');
        },
    },
    {
        code: 'PASS_CO',
        label: 'Pasaporte',
        country: 'CO',
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
exports.ALL_IDENTIFICATION_TYPES = [...exports.IDENTIFICATION_TYPES_CO];
function findByIdentificationType(code) {
    return exports.ALL_IDENTIFICATION_TYPES.find((t) => t.code === code);
}
//# sourceMappingURL=identification-types.js.map