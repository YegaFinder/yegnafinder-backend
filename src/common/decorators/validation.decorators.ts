import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsTimeFormat(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isTimeFormat',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return true; // Allow optional fields
          return typeof value === 'string' && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
        },
      },
    });
  };
}

export function IsValidImageUrl(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidImageUrl',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return true; // Allow optional fields
          const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|webp)(\?.*)?$/i;
          return typeof value === 'string' && urlPattern.test(value);
        },
      },
    });
  };
}
