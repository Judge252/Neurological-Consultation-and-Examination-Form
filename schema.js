(function initMedicalFormSchema(root, factory) {
    const schema = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = schema;
    } else {
        root.MEDICAL_FORM_SCHEMA = schema;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createSchema() {
    'use strict';

    const sections = [
        {
            id: 'patient-details',
            title: 'פרטי המטופל',
            fields: [
                { key: 'patientName', label: 'שם המטופל', type: 'text', required: true, maxLength: 120, wide: false },
                { key: 'patientPhone', label: 'טלפון', type: 'text', required: true, maxLength: 24, direction: 'ltr', validation: 'phone', wide: false },
                { key: 'address', label: 'כתובת', type: 'text', maxLength: 240, wide: false },
                { key: 'patientId', label: 'ת.ז', type: 'text', maxLength: 20, direction: 'ltr', validation: 'identity', wide: false },
                { key: 'age', label: 'גיל', type: 'number', min: 0, max: 130, wide: false },
                { key: 'gender', label: 'מין', type: 'enum', values: ['זכר', 'נקבה', 'אחר'], maxLength: 20, wide: false },
            ],
        },
        {
            id: 'treatment-summary',
            title: 'סיכום הטיפול',
            fields: [
                { key: 'referralReason', label: 'סיבת הפניה/תלונות', type: 'textarea', maxLength: 3000, wide: true },
                { key: 'treatmentType', label: 'סוג הטיפול', type: 'textarea', maxLength: 3000, wide: true },
                { key: 'treatmentCount', label: 'מספר הטיפולים', type: 'number', min: 1, max: 24, wide: false },
                { key: 'recommendations', label: 'סיכום והמלצות להמשך', type: 'textarea', maxLength: 4000, wide: true },
            ],
        },
        {
            id: 'physiotherapist-details',
            title: 'פרטי הפיזיותרפיסט',
            fields: [
                { key: 'physiotherapistName', label: 'שם הפיזיותרפיסט', type: 'text', maxLength: 120, wide: false },
                { key: 'licenseNumber', label: 'מספר רישיון', type: 'text', maxLength: 60, direction: 'ltr', wide: false },
                { key: 'examinationDate', label: 'תאריך', type: 'date', maxLength: 10, direction: 'ltr', wide: false },
            ],
        },
    ];

    const fields = sections.flatMap((section) => section.fields);
    const fieldMap = Object.fromEntries(fields.map((field) => [field.key, field]));

    return Object.freeze({
        version: 1,
        sections: Object.freeze(sections),
        fields: Object.freeze(fields),
        fieldMap: Object.freeze(fieldMap),
    });
});
