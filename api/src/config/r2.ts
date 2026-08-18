import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env";

const hasR2Credentials = Boolean(
  env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY,
);

export const r2Client = new S3Client({
  region: "auto",
  endpoint: env.R2_ACCOUNT_ID
    ? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : undefined,
  credentials: hasR2Credentials
    ? {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      }
    : undefined,
});

export const R2_BUCKET = env.R2_BUCKET_NAME || "";
