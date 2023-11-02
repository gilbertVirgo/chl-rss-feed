import * as prismicH from "@prismicio/helpers";

import fetch, { Headers } from "node-fetch";

import dayjs from "dayjs";
import duration from "dayjs/plugin/duration.js";
import escape from "escape-html";
import fs from "fs";
import { getAudioDurationInSeconds } from "get-audio-duration";
import getDirname from "./getDirname.js";
import log from "./log.js";
import path from "path";
import rfc822Date from "rfc822-date";
import sanitize from "sanitize-filename";

dayjs.extend(duration);

export default async ({
	title,
	description,
	audio_url,
	original_date_published,
}) => {
	const fileExtension = audio_url.url.split(".").slice(-1);
	const fileName = `${sanitize(title)}.${fileExtension}`;
	const filePath = path.join(
		getDirname(import.meta.url),
		"audio-files",
		fileName
	);

	if (!fs.existsSync(filePath)) {
		log("info", `${fileName} has not yet been fetched. Fetching now ..`);

		const audioFile = await fetch(audio_url.url).then((body) =>
			body.arrayBuffer()
		);
		await fs.promises.writeFile(filePath, Buffer.from(audioFile));
	}

	const audioDurationInSeconds = await getAudioDurationInSeconds(filePath);

	const durationObject = dayjs.duration(audioDurationInSeconds, "seconds");

	const xmlItem = `<item>
    <title>${escape(title)}</title>
    <description>${escape(prismicH.asText(description))}</description>
    <itunes:image href="https://is5-ssl.mzstatic.com/image/thumb/Podcasts125/v4/f7/87/1f/f7871fc7-e872-8acc-ad53-a824e98ba7e2/mza_15772983630683249442.jpg/626x0w.webp"/>
    <link>http://www.christianheritagelondon.org</link>
    <enclosure url="${
		audio_url.url
	}" length="${durationObject.asMilliseconds()}" type="audio/mpeg"/>
    <itunes:duration>${durationObject.format("HH:mm:ss")}</itunes:duration>
    <guid>${audio_url.url}</guid>
    <pubDate>${rfc822Date(new Date(original_date_published))}</pubDate>
</item>`;

	return xmlItem;
};
