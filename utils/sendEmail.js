const fs = require('fs');
const mustache = require('mustache');
const nodemailer = require('nodemailer');
const { responseData, responseMessage, responseDataWithToken } = require('../utils/response-handler');

// module.exports = {
// 	async sendMail(payload, params) {
// 		const template = fs.readFileSync(params.template, 'utf8');
// 		const url = params.url;

// 		const config ={
// 			service: 'gmail',
// 			auth: {
// 				user: 'no-reply@vissit.in',
// 				pass: 'cystfceplebjqkcp'
// 			}
// 		};

// 		const transporter = await nodemailer.createTransport(config);
// 		const mail = {
// 			from: 'no-reply@vissit.in',
// 			to: payload.email,
// 			subject: params.subject,
// 			// text: payload.body
// 			html: mustache.render(template, { ...payload, url })
// 		};

// 		transporter.sendMail(mail, function(error, info) {
// 			if(error) {
// 				console.log(error);
// 			}else {
// 				console.log('Email sent: ' + info.response);
// 			}
// 		});
// 	}
// };

exports.sendMail = async (req, res, next) => {
	const template = fs.readFileSync(req.params_data.template, 'utf8');
	const url = req.params_data.url;

	const config ={
		service: 'gmail',
		auth: {
			user: 'no-reply@vissit.in',
			pass: 'cystfceplebjqkcp'
		}
	};

	const transporter = await nodemailer.createTransport(config);
	const mail = {
		from: 'no-reply@vissit.in',
		to: req.payload.email,
		subject: req.params_data.subject,
		// text: payload.body
		html: mustache.render(template, { ...req.payload, url })
	};

	transporter.sendMail(mail, function(error, info) {
		if(error) {
			console.log(error);
		}else {
			console.log('Email sent: ' + info.response);
			responseMessage(res, 200, '000', req.params_data.message);
		}
	});
}
