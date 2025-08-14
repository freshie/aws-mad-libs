"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeDates = serializeDates;
exports.deserializeDates = deserializeDates;
function serializeDates(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (obj instanceof Date) {
        return obj.toISOString();
    }
    if (Array.isArray(obj)) {
        return obj.map(serializeDates);
    }
    if (typeof obj === 'object') {
        const serialized = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                serialized[key] = serializeDates(obj[key]);
            }
        }
        return serialized;
    }
    return obj;
}
function deserializeDates(obj, dateFields = ['createdAt', 'updatedAt', 'joinedAt', 'submittedAt']) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => deserializeDates(item, dateFields));
    }
    if (typeof obj === 'object') {
        const deserialized = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (dateFields.includes(key) && typeof obj[key] === 'string') {
                    deserialized[key] = new Date(obj[key]);
                }
                else {
                    deserialized[key] = deserializeDates(obj[key], dateFields);
                }
            }
        }
        return deserialized;
    }
    return obj;
}
