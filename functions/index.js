const functions = require('firebase-functions');
const { Storage } = require('@google-cloud/storage');
const projectID = 'YOUR_PROJECT_ID';
const gcs = new Storage({
    projectId: projectID
});
const os = require('os');
const path = require('path');
const spawn = require('child-process-promise').spawn;
const cors = require('cors')({ origin: true });
const Busboy = require('busboy');
const fs = require('fs');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

//          RESIZED IMAGE
// exports.onFileChange = functions.storage.object().onFinalize(event => {
//     const object = event;
//     const bucket = object.bucket;
//     const contentType = object.contentType;
//     const filePath = object.name;
//     console.log('File changed detected, function executed started');
//     if (object.timeDeleted) {
//         console.log('We deleted a file, exit...');
//     }
//     if (path.basename(filePath).startsWith('resized-')) {
//         console.log('We alredy resized that file!');
//         return;
//     }

//     const destBucket = gcs.bucket(bucket);
//     const tmpFilePath = path.join(os.tmpdir(), path.basename(filePath));
//     const metadata = { contentType: contentType };
//     return destBucket.file(filePath).download({
//         destination: tmpFilePath
//     }).then(() => {
//         return spawn('convert', [tmpFilePath, '-resize', '500x500', tmpFilePath]);

//     }).then(() => {
//         return destBucket.upload(tmpFilePath, {
//             destination: 'resized-' + path.basename(filePath),
//             metadata: metadata
//         })
//     });
// });

exports.uploadFile = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        if (req.method !== 'POST') {
            return req.status(500).json({
                message: 'Not allowed'
            });
        }
        const busboy = new Busboy({ headers: req.headers });
        let uploadData = null;

        busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
            const filepath = path.join(os.tmpdir(), filename);
            uploadData = { file: filepath, type: mimetype };
            file.pipe(fs.createWriteStream(filepath));
        });

        busboy.on('finish', () => {
            const bucket = gcs.bucket('YOUR_BUCKET');
            bucket.upload(uploadData.file, {
                uploadType: 'media',
                metadata: {
                    metadata: {
                        contentType: uploadData.type
                    }
                }
            })
            .then(() => {
                return res.status(200).json({
                    message: 'It worked'
                });
            })
            .catch(err => {
                return res.status(500).json({
                    error: err
                });
            });
        });
        busboy.end(req.rawBody);
    });
});