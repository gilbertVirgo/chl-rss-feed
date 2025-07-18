import formatEpisodes from "./formatEpisodes.js";
import fs from "fs";
import getDirname from "./getDirname.js";
import getEpisodes from "./getEpisodes.js";
import log from "./log.js";
import patchXMLFileOnS3 from "./patchXMLFileOnS3.js";
import path from "path";

const init = async () => {
	try {
		const __dirname = getDirname(import.meta.url);
		const episodeDurationsFilePath = path.join(
			__dirname,
			"episodeDurations.json"
		);

		if (!fs.existsSync(episodeDurationsFilePath))
			fs.writeFileSync(episodeDurationsFilePath, JSON.stringify([]), {
				encoding: "utf-8",
			});

		const episodes = await getEpisodes();
		log("info", `Successfully got podcast JSON from Prismic`);

		const formattedEpisodes = await formatEpisodes(episodes); // json -> xml

		await patchXMLFileOnS3(formattedEpisodes);
		log(
			"info",
			`Successfully uploaded the new file to AWS S3. Find it at https://chl-rss-feed.s3.eu-west-2.amazonaws.com/rss.xml`
		);

		// Clean up
		fs.rmSync(path.join(__dirname, "downloads"), {
			recursive: true,
			force: true,
		});
	} catch (error) {
		log("error", error.stack);
	}
};

init();
