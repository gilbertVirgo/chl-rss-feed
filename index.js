import formatEpisodes from "./formatEpisodes.js";
import fs from "fs";
import getDirname from "./getDirname.js";
import getEpisodes from "./getEpisodes.js";
import log from "./log.js";
import patchXMLFileOnS3 from "./patchXMLFileOnS3.js";
import path from "path";
import fetch from "node-fetch";

let bucketURL = `https://${process.env.AWS_BUCKET_NAME}.s3.eu-west-2.amazonaws.com/rss.xml`;
let __dirname = getDirname(import.meta.url);
let episodeDurationsFilePath = path.join(__dirname, "episodeDurations.json");

let init = async () => {
	try {
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
	} catch (error) {
		log("error", error.stack);
	}

	// Clean up
	fs.rmSync(path.join(__dirname, "downloads"), {
		recursive: true,
		force: true,
	});

	log("info", "Cleaned up temporary files");
};

init();
