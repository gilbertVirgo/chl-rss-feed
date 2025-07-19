export default (type, message) => {
	const timestamp = new Date().toISOString();
	console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
};
