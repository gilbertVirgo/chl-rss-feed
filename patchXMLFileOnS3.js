import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const { AWS_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_ACCESS_KEY_SECRET } =
	process.env;

export default async (xmlFileContents) => {
	const client = new S3Client({
		region: "eu-west-2",
		credentials: {
			accessKeyId: AWS_ACCESS_KEY_ID,
			secretAccessKey: AWS_ACCESS_KEY_SECRET,
		},
	});

	const putObjectCommand = new PutObjectCommand({
		Body: Buffer.from(xmlFileContents),
		Bucket: AWS_BUCKET_NAME,
		Key: "rss.xml",
	});

	return client.send(putObjectCommand); // return response
};
