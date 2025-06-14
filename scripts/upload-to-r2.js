import fs from 'fs';
import path from 'path';
import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Setup R2 client (S3-compatible)
const r2 = new AWS.S3({
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  endpoint: process.env.R2_ENDPOINT,
  signatureVersion: 'v4',
  region: 'auto'
});

const BUCKET = process.env.R2_BUCKET_NAME;
const BASE_DIR = './voice-lines';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
}

const files = walk(BASE_DIR).filter(file => file.endsWith('.mp3'));

files.forEach((filePath) => {
  const key = filePath.replace(BASE_DIR + '/', '').replace(/\\/g, '/');
  const fileStream = fs.createReadStream(filePath);

  const params = {
    Bucket: BUCKET,
    Key: `voice-lines/${key}`,
    Body: fileStream,
    ContentType: 'audio/mpeg',
    ACL: 'public-read' // Make files publicly accessible
  };

  r2.upload(params, (err, data) => {
    if (err) {
      console.error(`❌ Failed to upload ${key}:`, err);
    } else {
      console.log(`✅ Uploaded: ${data.Location}`);
    }
  });
}); 