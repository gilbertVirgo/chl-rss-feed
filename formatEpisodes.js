import dayjs from "dayjs";
import formatEpisode from "./formatEpisode.js";

export default async (episodes) => {
	let formattedEpisodes = [];

	for (const { data: episode } of episodes.sort(
		({ data: a }, { data: b }) =>
			new Date(b.original_date_published) -
			new Date(a.original_date_published)
	)) {
		const formattedEpisode = await formatEpisode(episode);
		formattedEpisodes.push(formattedEpisode);
	}

	return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom" version="2.0">
	<channel>
		<title>Christian Heritage London Podcast</title>
		<link>https://www.christianheritagelondon.org</link>
		<description> Christian Heritage London exists to serve London's churches and visitors, offering equipping events and telling the stories of the massive impact of the gospel in this city. </description>
		<language>en-gb</language>
		<copyright>Copyright Christian Heritage London ${dayjs().format(
			"YYYY"
		)}</copyright>
		<lastBuildDate>${dayjs().format(
			"ddd[, ]D MMM YYYY HH:mm:ss[ GMT]"
		)}</lastBuildDate>
		<itunes:author>Christian Heritage London</itunes:author>
		<itunes:summary>Christian Heritage London exists to serve London's churches and visitors, offering equipping events and telling the stories of the massive impact of the gospel in this city. On the Christian Heritage London podcast we meet Christian leaders who serve the church in the purpose, perspective and power of the gospel. </itunes:summary>
		<itunes:owner>
		<itunes:name>Christian Heritage London</itunes:name>
		<itunes:email>info@christianheritagelondon.org</itunes:email>
		</itunes:owner>
		<itunes:explicit>No</itunes:explicit>
		<itunes:image href="https://chlmedia.s3.eu-west-2.amazonaws.com/chl-podcast-image.jpg"/>
		<itunes:category text="Religion &amp; Spirituality"/>
		<itunes:subtitle>Christian Heritage London exists to serve London's churches and visitors, offering equipping events and telling the stories of the massive impact of the gospel in this city.</itunes:subtitle>
		<atom:link href="https://chl-rss-feed.s3.eu-west-2.amazonaws.com/rss.xml" rel="self" type="application/rss+xml"/>
		${formattedEpisodes.join("\n")}
	</channel>
</rss>    
`;
};

// <atom:link href="http://api.christianheritagelondon.org/rss.xml" rel="self" type="application/rss+xml"/>
