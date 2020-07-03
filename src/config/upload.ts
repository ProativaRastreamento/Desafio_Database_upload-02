import path from 'path';
import multer from 'multer';
import cryptor from 'crypto';

const uplouderFolder = path.resolve(__dirname, '..', '..', 'upload');

export default {
    directory: uplouderFolder,
    storage: multer.diskStorage({
        destination: uplouderFolder,
        filename(request, file, callback) {
            const fileHash = cryptor.randomBytes(10).toString('hex');
            const fileName = `${fileHash}-${file.originalname}`;

            return callback(null, fileName);
        },
    }),
};