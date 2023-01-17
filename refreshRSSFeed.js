import * as prismic from "@prismicio/client";

import { dirname } from "path";
import ellipsize from "ellipsize";
import episodeToRSS from "./episodeToRSS.js";
import fetch from "node-fetch";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const repoName = "chl-cms";
const endpoint = prismic.getRepositoryEndpoint(repoName);
const client = prismic.createClient(endpoint, { fetch });

const init = async () => {
	const episodes = await client.getAllByType("podcast");

	// Get output directory from args.
	const outputDir = process.argv[2];

	fs.writeFileSync(
		`${outputDir || __dirname}/rss.xml`,
		`<?xml version="1.0" encoding="UTF-8"?>
		<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom" version="2.0">
<channel>
<title>Christian Heritage London Podcast</title>
<link>https://www.christianheritagelondon.org</link>
<description> Christian Heritage London exists to serve London's churches and visitors, offering equipping events and telling the stories of the massive impact of the gospel in this city. </description>
<language>en-gb</language>
<copyright>Copyright Christian Heritage London 2017</copyright>
<lastBuildDate>Mon, 17 Apr 2017 20:00:00 GMT</lastBuildDate>
<itunes:author>Christian Heritage London</itunes:author>
<itunes:summary>Christian Heritage London exists to serve London's churches and visitors, offering equipping events and telling the stories of the massive impact of the gospel in this city. On the Christian Heritage London podcast we meet Christian leaders who serve the church in the purpose, perspective and power of the gospel. </itunes:summary>
<itunes:owner>
<itunes:name>Christian Heritage London</itunes:name>
<itunes:email>info@christianheritagelondon.org</itunes:email>
</itunes:owner>
<itunes:explicit>No</itunes:explicit>
<itunes:image href="https://is5-ssl.mzstatic.com/image/thumb/Podcasts125/v4/f7/87/1f/f7871fc7-e872-8acc-ad53-a824e98ba7e2/mza_15772983630683249442.jpg/626x0w.webp"/>
<itunes:category text="Religion &amp; Spirituality"/>
<itunes:subtitle> Christian Heritage London exists to serve London's churches and visitors, offering equipping events and telling the stories of the massive impact of the gospel in this city. </itunes:subtitle>
<atom:link href="http://api.christianheritagelondon.org/rss.xml" rel="self" type="application/rss+xml"/>
${episodes
	.sort(
		({ data: a }, { data: b }) =>
			new Date(b.original_date_published) -
			new Date(a.original_date_published)
	)
	.map(({ data }) => episodeToRSS(data))
	.join("\n")}
</channel>
</rss>    
`
	);

	fs.appendFileSync(
		`${__dirname}/log`,
		`[${new Date().toJSON()}] Refreshed podcast feed\r\n`
	);
};

init();
