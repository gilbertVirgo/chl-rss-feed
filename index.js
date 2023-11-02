import formatEpisodes from "./formatEpisodes.js";
import getEpisodes from "./getEpisodes.js";
import log from "./log.js";
import patchXMLFileOnS3 from "./patchXMLFileOnS3.js";

const init = async () => {
	try {
		const episodes = await getEpisodes();
		log("prismic", episodes);

		const formattedEpisodes = formatEpisodes(episodes); // json -> xml

		const awsResponse = await patchXMLFileOnS3(formattedEpisodes);
		log("aws", awsResponse);
	} catch (error) {
		log("error", error);
	}
};

init();
