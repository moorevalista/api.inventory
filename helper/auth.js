const md5 = require('md5');
var jwt = require('jsonwebtoken');

exports.privateKey = () => {
	return md5('@MooreValista100716');
}

//generate Token
exports.getToken = async (req, res, next) => {
	const data = req.params_data;
	const secret_key = await this.privateKey();
	const issuer_claim = 'https://soyo.co.id';
	const audience_claim = 'https://api.soyo.co.id';
	const issuedat_claim = Math.floor(new Date().getTime() / 1000);
	const notbefore_claim = issuedat_claim + 0;
	const expire_claim = issuedat_claim + 3600;

	const paramsToken = {
		iss: issuer_claim,
		aud: audience_claim,
		iat: issuedat_claim,
		data: {
			id: data.id_user,
			nama_user: data.nama_user,
			hp: data.hp
		}
	};

	const token = jwt.sign(paramsToken, secret_key);
	return token;
}