 const validators = {
    isUndefined(value) {
      return value === undefined;
    },
  
    isNotValidString(value) {
      return typeof value !== "string" || value.trim().length === 0 || value === "";
    },
  
    isNotValidInteger(value) {
      return typeof value !== "number" || value < 0 || value % 1 !== 0;
    }
  };

  module.exports = validators;

