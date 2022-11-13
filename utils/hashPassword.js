const bcrypt = require('bcrypt');

async function hashPassword(plainText) {
	const hash = await bcrypt.hash(plainText, 10);

	return hash;
}

async function comparePassword(plainText, hash) {
	const result = await bcrypt.compare(plainText, hash);

	return result;
}

module.exports = { hashPassword, comparePassword };