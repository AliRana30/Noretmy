const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_S3,
  secretAccessKey: process.env.AWS_SECRET_KEY_S3,
  region: process.env.AWS_REGION,
});

module.exports = s3;
