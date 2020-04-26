import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const destFolder = path.resolve(__dirname, '..', '..', 'tmp');

const uploadConfig = {
  directory: destFolder,
  storage: multer.diskStorage({
    destination: destFolder,
    filename: (request, file, callback) => {
      const fileHash = crypto.randomBytes(8).toString('HEX');
      const fileName = `${fileHash}-${file.originalname}`;
      callback(null, fileName);
    },
  }),
};

export default uploadConfig;
