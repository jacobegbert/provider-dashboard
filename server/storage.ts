// S3 file storage — replaces the old Forge proxy with direct AWS S3 uploads
// Uses pre-signed URLs for downloads and direct PutObject for uploads

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REGION = process.env.AWS_REGION || "us-east-1";
const BUCKET = process.env.S3_BUCKET_NAME || "black-label-medicine";

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (!_client) {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        "AWS credentials missing: set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables"
      );
    }

    _client = new S3Client({
      region: REGION,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return _client;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

/**
 * Upload a file to S3.
 * Returns the key and a public/presigned URL.
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const client = getClient();
  const key = normalizeKey(relKey);

  const body =
    typeof data === "string" ? Buffer.from(data, "utf-8") : data;

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  // Return a pre-signed download URL valid for 7 days
  const url = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: 7 * 24 * 60 * 60 }
  );

  return { key, url };
}

/**
 * Get a pre-signed download URL for an existing file.
 */
export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const client = getClient();
  const key = normalizeKey(relKey);

  const url = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: 7 * 24 * 60 * 60 }
  );

  return { key, url };
}
