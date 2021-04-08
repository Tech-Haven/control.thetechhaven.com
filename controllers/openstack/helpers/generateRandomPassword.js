const generateRandomPassword = () => {
  const list =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&()';
  const size = list.length;
  let generatedPassword = '';
  for (let i = 0; i < 20; ++i) {
    generatedPassword =
      generatedPassword + list.charAt(Math.floor(Math.random() * size));
  }

  return generatedPassword;
};

module.exports = generateRandomPassword;
