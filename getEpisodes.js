import * as prismic from "@prismicio/client";

import fetch from "node-fetch";

export default () => {
	const repoName = "chl-cms";
	const endpoint = prismic.getRepositoryEndpoint(repoName);
	const client = prismic.createClient(endpoint, { fetch });

	return client.getAllByType("podcast");
};
