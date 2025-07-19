import * as prismicH from "@prismicio/helpers";

import dayjs from "dayjs";
import duration from "dayjs/plugin/duration.js";
import escape from "escape-html";
import fetch from "node-fetch";
import fs from "fs";
import { getAudioDurationInSeconds } from "get-audio-duration";
import getDirname from "./getDirname.js";
import log from "./log.js";
import os from "os";
import path from "path";
import rfc822Date from "rfc822-date";

dayjs.extend(duration);

export default async ({
	title,
	description,
	audio_url,
	original_date_published,
}) => {
	const __dirname = getDirname(import.meta.url);

	// Determine ffprobe binary name based on OS
	const platform = os.platform();
	const ffprobeBinary =
		platform === "darwin" ? "ffprobe-osx-64" : "ffprobe-linux-64";

	const episodeDurations = JSON.parse(
		fs.readFileSync(path.join(__dirname, "episodeDurations.json"))
	);

	const episode = episodeDurations.find(
		(episode) => episode.title === title
	) || { title };

	if (!episode.duration) {
		// Create downloads folder if doesn't exist
		const downloadsDirectoryPath = path.join(__dirname, "downloads");
		if (!fs.existsSync(downloadsDirectoryPath))
			fs.mkdirSync(downloadsDirectoryPath);

		// Fetch the audio file for analysis
		const audioFile = await fetch(audio_url.url).then((body) =>
			body.arrayBuffer()
		);
		const fileExtension = audio_url.url.split(".").slice(-1);
		const fileName = `audio.${fileExtension}`;
		const filePath = path.join(downloadsDirectoryPath, fileName);

		fs.writeFileSync(filePath, Buffer.from(audioFile));

		// Write the duration to episodeDurations.json
		episode.duration = await getAudioDurationInSeconds(
			filePath,
			path.join(__dirname, ffprobeBinary)
		);

		fs.writeFileSync(
			path.join(__dirname, "episodeDurations.json"),
			JSON.stringify([episode, ...episodeDurations])
		);
	}

	const durationObject = dayjs.duration(episode.duration, "seconds");

	const xmlItem = `<item>
    <title>${escape(title)}</title>
    <description>${escape(prismicH.asText(description))}</description>
    <itunes:image href="https://is5-ssl.mzstatic.com/image/thumb/Podcasts125/v4/f7/87/1f/f7871fc7-e872-8acc-ad53-a824e98ba7e2/mza_15772983630683249442.jpg/626x0w.webp"/>
    <link>https://www.christianheritagelondon.org</link>
    <enclosure url="${audio_url.url}" length="${parseInt(
		durationObject.asSeconds()
	)}" type="audio/mpeg"/>
    <itunes:duration>${durationObject.format("HH:mm:ss")}</itunes:duration>
    <guid>${audio_url.url}</guid>
    <pubDate>${rfc822Date(new Date(original_date_published))}</pubDate>
</item>`;

	return xmlItem;
};
