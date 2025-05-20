// const crypto = require('crypto');
// require('dotenv').config();
// const secretKey = process.env.SECRET_KEY_ENCRYPT


// exports.encrypt = (text) => {
//   try {
//     const iv = crypto.randomBytes(16);
//     let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey), iv);
//     let encrypted = cipher.update(text);
//     encrypted = Buffer.concat([encrypted, cipher.final()]);
//     return iv.toString('hex') + ':' + encrypted.toString('hex');
//   } catch (err) {
//     console.error('Encryption error:', err.message);
//   }
// };


// exports.decrypt = (text) => {
//   if (!text || !text.includes(':')) return text;

//   try {
//     let [ivHex, encryptedHex] = text.split(':');
//     let iv = Buffer.from(ivHex, 'hex');
//     let encryptedText = Buffer.from(encryptedHex, 'hex');
//     let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey), iv);
//     let decrypted = decipher.update(encryptedText);
//     decrypted = Buffer.concat([decrypted, decipher.final()]);
//     return decrypted.toString();
//   } catch (err) {
//     console.error('Decryption error:', err.message);
//     return text; 
//   }
// };

const crypto = require('crypto');
require('dotenv').config();

const secretKey = process.env.SECRET_KEY_ENCRYPT;

exports.encrypt =(text)=> {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

exports.decrypt=(text)=> {
  if (!text.includes(':')) return text;

  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = Buffer.from(parts[1], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}