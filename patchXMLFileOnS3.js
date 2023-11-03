import {
	CreateBucketCommand,
	DeleteBucketCommand,
	DeleteObjectCommand,
	DeletePublicAccessBlockCommand,
	PutBucketPolicyCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";

import awsBucketPolicy from "./awsBucketPolicy.js";
import log from "./log.js";

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

	// Unless you delete the object AND THE BUCKET, the file will cache and there's nothing you can do about that.
	// So I spent (probably) 5 hours getting this to work...
	const commandChain = [
		new DeleteObjectCommand({
			Bucket: AWS_BUCKET_NAME,
			Key: "rss.xml",
		}),
		new DeleteBucketCommand({
			Bucket: AWS_BUCKET_NAME,
		}),
		new CreateBucketCommand({
			Bucket: AWS_BUCKET_NAME,
			ObjectOwnership: "ObjectWriter",
			CreateBucketConfiguration: {
				LocationConstraint: "eu-west-2",
			},
		}),
		// This fiesty little command was what I spent literally hours
		// trying to find. It was buried DEEP in all of the utterly
		// nonsensical documentation. But found it eventually. Oh joy!
		new DeletePublicAccessBlockCommand({
			Bucket: AWS_BUCKET_NAME,
		}),
		new PutBucketPolicyCommand({
			Bucket: AWS_BUCKET_NAME,
			Policy: awsBucketPolicy,
		}),
		new PutObjectCommand({
			Body: Buffer.from(xmlFileContents, "utf-8"),
			Bucket: AWS_BUCKET_NAME,
			Key: "rss.xml",
			ContentType: "text/xml",
			ACL: "public-read",
		}),
	];

	for (const command of commandChain) {
		log("aws", "Executing command ", JSON.stringify(command));
		await client.send(command);
	}

	return true;
};
