import formatEpisodes from "./formatEpisodes.js";
import fs from "fs";
import getEpisodes from "./getEpisodes.js";
import log from "./log.js";
import patchXMLFileOnS3 from "./patchXMLFileOnS3.js";
import path from "path";
import fetch from "node-fetch";

export const handler = async (event, context) => {
	try {
		// Check for authentication token
		const authToken = process.env.AUTH_TOKEN;
		const providedToken =
			event.headers.authorization?.replace("Bearer ", "") ||
			event.headers["x-auth-token"];

		if (!authToken) {
			log("error", "AUTH_TOKEN environment variable not configured");
			return {
				statusCode: 500,
				body: JSON.stringify({
					error: "Server configuration error",
					timestamp: new Date().toISOString(),
				}),
			};
		}

		if (!providedToken || providedToken !== authToken) {
			log("error", "Unauthorized access attempt");
			return {
				statusCode: 401,
				body: JSON.stringify({
					error: "Unauthorized - Invalid or missing auth token",
					timestamp: new Date().toISOString(),
				}),
			};
		}

		let bucketURL = `https://${process.env.AWS__BUCKET_NAME}.s3.eu-west-2.amazonaws.com/rss.xml`;

		// Get the directory of the current function file
		const currentDir = import.meta.url
			? path.dirname(new URL(import.meta.url).pathname)
			: process.cwd();

		// Use absolute paths that work in serverless environments
		let episodeDurationsFilePath = path.resolve(
			currentDir,
			"episodeDurations.json"
		);
		if (!fs.existsSync(episodeDurationsFilePath))
			fs.writeFileSync(episodeDurationsFilePath, JSON.stringify([]), {
				encoding: "utf-8",
			});

		let episodes = await getEpisodes();
		log("info", `Successfully got podcast JSON from Prismic`);

		let formattedEpisodes = await formatEpisodes(episodes); // json -> xml

		// Fetch the existing XML file from S3
		let response = await fetch(bucketURL);

		if (!response.ok) {
			throw new Error(
				`Failed to fetch the XML file: ${response.statusText}`
			);
		}

		let existingXML = await response.text();
		log("info", "Successfully fetched the existing XML file from S3");

		let areEqual = (a, b) => {
			let extractEnclosureUrls = (xml) => {
				let urls = [];
				let regex = /<enclosure[^>]*url="([^"]+)"[^>]*>/g;
				let match;
				while ((match = regex.exec(xml)) !== null) {
					urls.push(match[1]);
				}
				return urls.sort(); // Sort to ensure order doesn't affect comparison
			};

			let urlsA = extractEnclosureUrls(a);
			let urlsB = extractEnclosureUrls(b);

			return JSON.stringify(urlsA) === JSON.stringify(urlsB);
		};

		let uploadRequired = true;

		if (areEqual(existingXML, formattedEpisodes)) {
			log(
				"info",
				"The existing XML and formatted episodes are identical."
			);
			uploadRequired = false;
		}

		if (uploadRequired) {
			await patchXMLFileOnS3(formattedEpisodes);
			log(
				"info",
				`Successfully uploaded the new file to AWS S3. Find it at ${bucketURL}`
			);
		} else {
			log("info", "No changes detected. No upload required.");
		}

		// Clean up
		let downloadsPath = path.resolve(currentDir, "downloads");
		if (fs.existsSync(downloadsPath)) {
			fs.rmSync(downloadsPath, {
				recursive: true,
				force: true,
			});
		}

		log("info", "Cleaned up temporary files");

		return {
			statusCode: 200,
			body: JSON.stringify({
				message: uploadRequired
					? "RSS feed updated successfully"
					: "No changes detected, RSS feed unchanged",
				uploadRequired,
				timestamp: new Date().toISOString(),
			}),
		};
	} catch (error) {
		log("error", error.stack);

		return {
			statusCode: 500,
			body: JSON.stringify({
				error: "Internal server error",
				message: error.message,
				timestamp: new Date().toISOString(),
			}),
		};
	}
};
