import * as prismicH from "@prismicio/helpers";

import escape from "escape-html";
import rfc822Date from "rfc822-date";

export default ({ title, description, audio_url, original_date_published }) => {
	return escape(`<item>
    <title>${title}</title>
    <description>${prismicH.asText(description)}</description>
    <itunes:image href="https://is5-ssl.mzstatic.com/image/thumb/Podcasts125/v4/f7/87/1f/f7871fc7-e872-8acc-ad53-a824e98ba7e2/mza_15772983630683249442.jpg/626x0w.webp"/>
    <link>http://www.christianheritagelondon.org</link>
    <enclosure url="${audio_url.url}" length="0" type="audio/mpeg"/>
    <itunes:duration>00:00:00</itunes:duration>
    <guid>${audio_url.url}</guid>
    <pubDate>${rfc822Date(new Date(original_date_published))}</pubDate>
</item>`);
};
