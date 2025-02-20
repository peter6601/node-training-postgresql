const validators = require('./validators.js');

 describe('驗證器測試', () => {
    // isUndefined 測試
    describe('未定義值檢查', () => {
      test('當值為 undefined 時應該回傳 true', () => {
        expect(validators.isUndefined(undefined)).toBe(true);
      });
  
      test('當值不為 undefined 時應該回傳 false', () => {
        expect(validators.isUndefined(null)).toBe(false);
        expect(validators.isUndefined('')).toBe(false);
        expect(validators.isUndefined(0)).toBe(false);
        expect(validators.isUndefined(false)).toBe(false);
        expect(validators.isUndefined({})).toBe(false);
      });
    });
  
    // isNotValidString 測試
    describe('無效字串檢查', () => {
      test('非字串型別應該回傳 true', () => {
        expect(validators.isNotValidString(123)).toBe(true);
        expect(validators.isNotValidString(null)).toBe(true);
        expect(validators.isNotValidString(undefined)).toBe(true);
        expect(validators.isNotValidString({})).toBe(true);
      });
  
      test('空字串應該回傳 true', () => {
        expect(validators.isNotValidString('')).toBe(true);
        expect(validators.isNotValidString('   ')).toBe(true);
      });
  
      test('有效字串應該回傳 false', () => {
        expect(validators.isNotValidString('你好')).toBe(false);
        expect(validators.isNotValidString('  測試  ')).toBe(false);
      });
    });
  
    // isNotValidInteger 測試
    describe('無效整數檢查', () => {
      test('非數字型別應該回傳 true', () => {
        expect(validators.isNotValidInteger('123')).toBe(true);
        expect(validators.isNotValidInteger(null)).toBe(true);
        expect(validators.isNotValidInteger(undefined)).toBe(true);
        expect(validators.isNotValidInteger({})).toBe(true);
      });
  
      test('負數應該回傳 true', () => {
        expect(validators.isNotValidInteger(-1)).toBe(true);
        expect(validators.isNotValidInteger(-100)).toBe(true);
      });
  
      test('非整數應該回傳 true', () => {
        expect(validators.isNotValidInteger(1.5)).toBe(true);
        expect(validators.isNotValidInteger(0.1)).toBe(true);
      });
  
      test('有效整數應該回傳 false', () => {
        expect(validators.isNotValidInteger(0)).toBe(false);
        expect(validators.isNotValidInteger(1)).toBe(false);
        expect(validators.isNotValidInteger(100)).toBe(false);
      });
    });
  
    // validateName 測試
    describe('名稱驗證', () => {
      test('無效的輸入類型應該回傳 false', () => {
        expect(validators.validateName(undefined)).toBe(false);
        expect(validators.validateName(null)).toBe(false);
        expect(validators.validateName('')).toBe(false);
        expect(validators.validateName('  ')).toBe(false);
      });
  
      test('不符合長度要求的名稱應該回傳 false', () => {
        expect(validators.validateName('李')).toBe(false);  // 太短
        expect(validators.validateName('超過十個字的名稱測試測試')).toBe(false);  // 太長
      });
  
      test('包含無效字符的名稱應該回傳 false', () => {
        expect(validators.validateName('測試!')).toBe(false);
        expect(validators.validateName('測試@')).toBe(false);
        expect(validators.validateName('測試 測試')).toBe(false);
      });
  
      test('有效的名稱應該回傳 true', () => {
        expect(validators.validateName('張三')).toBe(true);
        expect(validators.validateName('王小明')).toBe(true);
        expect(validators.validateName('Test123')).toBe(true);
        expect(validators.validateName('王5')).toBe(true);
      });
    });
  
    // validateEmail 測試
    describe('電子郵件驗證', () => {
      test('無效的輸入類型應該回傳 false', () => {
        expect(validators.validateEmail(undefined)).toBe(false);
        expect(validators.validateEmail(null)).toBe(false);
        expect(validators.validateEmail('')).toBe(false);
        expect(validators.validateEmail('  ')).toBe(false);
      });
  
      test('包含連續點號的電子郵件應該回傳 false', () => {
        expect(validators.validateEmail('test..test@example.com')).toBe(false);
      });
  
      test('格式錯誤的電子郵件應該回傳 false', () => {
        expect(validators.validateEmail('test@')).toBe(false);
        expect(validators.validateEmail('@example.com')).toBe(false);
        expect(validators.validateEmail('test@example')).toBe(false);
        expect(validators.validateEmail('test@.com')).toBe(false);
        expect(validators.validateEmail('test@example.')).toBe(false);
      });
  
      test('有效的電子郵件應該回傳 true', () => {
        expect(validators.validateEmail('test@example.com')).toBe(true);
        expect(validators.validateEmail('user.name@domain.com')).toBe(true);
        expect(validators.validateEmail('user-name@domain.com')).toBe(true);
        expect(validators.validateEmail('test@sub.domain.com')).toBe(true);
      });
    });
  
    // validatePassword 測試
    describe('密碼驗證', () => {
      test('無效的輸入類型應該回傳 false', () => {
        expect(validators.validatePassword(undefined)).toBe(false);
        expect(validators.validatePassword(null)).toBe(false);
        expect(validators.validatePassword('')).toBe(false);
        expect(validators.validatePassword('  ')).toBe(false);
      });
  
      test('不符合長度要求的密碼應該回傳 false', () => {
        expect(validators.validatePassword('Aa1')).toBe(false);  // 太短
        expect(validators.validatePassword('Aa1' + 'a'.repeat(14))).toBe(false);  // 太長
      });
  
      test('缺少必要字符的密碼應該回傳 false', () => {
        expect(validators.validatePassword('abcdefgh')).toBe(false);  // 沒有大寫字母和數字
        expect(validators.validatePassword('ABCDEFGH')).toBe(false);  // 沒有小寫字母和數字
        expect(validators.validatePassword('12345678')).toBe(false);  // 沒有字母
        expect(validators.validatePassword('abcd1234')).toBe(false);  // 沒有大寫字母
        expect(validators.validatePassword('ABCD1234')).toBe(false);  // 沒有小寫字母
      });
  
      test('有效的密碼應該回傳 true', () => {
        expect(validators.validatePassword('Password123')).toBe(true);
        expect(validators.validatePassword('TestPass1')).toBe(true);
        expect(validators.validatePassword('Abcd1234')).toBe(true);
      });
    });
  });