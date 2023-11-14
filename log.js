import dayjs from "dayjs";
import fs from "fs";
import getDirname from "./getDirname.js";
import path from "path";

export default (type, message, eventDescriptor = " ") => {
	console.log({ type, message });

	const logDirPath = path.join(getDirname(import.meta.url), "log");

	if (!fs.existsSync(logDirPath)) fs.mkdirSync(logDirPath);

	const logFilePath = path.join(logDirPath, `${type}.log`);

	// if (type === "info") console.log(message);

	fs.appendFileSync(
		logFilePath,
		`[${dayjs().format("DD/MM/YYYY HH:mm:ss")}]` +
			eventDescriptor +
			`${message}\r\n`
	);
};
