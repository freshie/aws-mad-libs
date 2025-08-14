// Utility functions for handling date serialization in API responses

export function serializeDates(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (obj instanceof Date) {
    return obj.toISOString()
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeDates)
  }
  
  if (typeof obj === 'object') {
    const serialized: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        serialized[key] = serializeDates(obj[key])
      }
    }
    return serialized
  }
  
  return obj
}

export function deserializeDates(obj: any, dateFields: string[] = ['createdAt', 'updatedAt', 'joinedAt', 'submittedAt']): any {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deserializeDates(item, dateFields))
  }
  
  if (typeof obj === 'object') {
    const deserialized: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (dateFields.includes(key) && typeof obj[key] === 'string') {
          deserialized[key] = new Date(obj[key])
        } else {
          deserialized[key] = deserializeDates(obj[key], dateFields)
        }
      }
    }
    return deserialized
  }
  
  return obj
}