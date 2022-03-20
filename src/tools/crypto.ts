import Crypto from 'crypto-js';

const crypto = (function () {
  const salt = Crypto.enc.Utf8.parse('fxy');
  function encrypt(text: string) {
    return Crypto.DES.encrypt(text, salt, {
      mode: Crypto.mode.ECB,
      padding: Crypto.pad.Pkcs7,
    }).ciphertext.toString();
  }
  function decrypt(ciphertext: string) {
    // return Crypto.DES.decrypt(ciphertext, salt, {
    //   mode: Crypto.mode.ECB,
    //   padding: Crypto.pad.Pkcs7,
    // })
    return Crypto.DES.decrypt(
      {
        ciphertext: Crypto.enc.Hex.parse(ciphertext),
      } as any,
      salt,
      {
        mode: Crypto.mode.ECB,
        padding: Crypto.pad.Pkcs7,
      },
    ).toString(Crypto.enc.Utf8);
  }
  return {
    encrypt,
    decrypt,
  };
})()


export default crypto