const validators = {
  isUndefined(value) {
    return value === undefined;
  },

  isNotValidString(value) {
    return typeof value !== "string" || value.trim().length === 0 || value === "";
  },

  isNotValidInteger(value) {
    return typeof value !== "number" || value < 0 || value % 1 !== 0;
  },
  
  validateName(name) {
    if (validators.isUndefined(name) || validators.isNotValidString(name)) {
      return false
    }
    if (name.length < 2 || name.length > 10) {
      return false
    }
    const regex = /^[\u4e00-\u9fa5a-zA-Z0-9]+$/;
    if (!regex.test(name)) {
      return false
    }
    return true
  },

  validateEmail(email) {
    if (validators.isUndefined(email) || validators.isNotValidString(email)) {
      return false
    }
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email) || email.includes('..')) {
      return false
    }
    return true
  },

  validatePassword(password) {
    if (validators.isUndefined(password) || validators.isNotValidString(password)) {
      return false
    }
    if (password.length < 8 || password.length > 16) {
      return false
    }
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).+$/;
    if (!passwordRegex.test(password)) {
      return false
    }
    return true
  }
};





module.exports = validators;

