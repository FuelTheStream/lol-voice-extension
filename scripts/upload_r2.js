require('dotenv').config();
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

const {
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  R2_ACCOUNT_ID
} = process.env;

const endpoint = new AWS.Endpoint(`${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`);
const s3 = new AWS.S3({
  endpoint,
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  signatureVersion: 'v4'
});

async function uploadDir(dir, bucket, prefix = '') {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      await uploadDir(full, bucket, `${prefix}${name}/`);
    } else {
      const body = fs.readFileSync(full);
      await s3.putObject({
        Bucket: bucket,
        Key: `${prefix}${name}`,
        Body: body,
        ACL: 'public-read'
      }).promise();
      console.log(`Uploaded: ${prefix}${name}`);
    }
  }
}

(async () => {
  const local = path.join(__dirname, '..', 'assets', 'voice-lines');
  await uploadDir(local, R2_BUCKET_NAME);
})();
