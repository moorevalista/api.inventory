const {
	registrasi,
	validationHp,
	validationEmail,
	verifyEmail,
	login,
	logout,
	checkToken,
	validationPassword,
	updatePassword,
	updateDataOutlet,

} = require('../models/user-model');
const {
	validateUser,
	validateHp,
	validateEmail,
	validateUpdateOutlet,

} = require('../utils/validation');
const ErrorResponse = require('../utils/errorResponse');
const { hashPassword, comparePassword } = require('../utils/hashPassword');
const { responseData, responseMessage, responseDataWithToken } = require('../utils/response-handler');

const { apiUrl } = require('../helper/apiHelper');
const { privateKey, getToken } = require('../helper/auth');
const md5 = require('md5');
var axios = require('axios');
var moment = require('moment');
var jwt = require('jsonwebtoken');

const multer = require('multer');
var path = require('path');
const sharp = require("sharp");
const fs = require('fs');
var http = require('http');
const { async } = require('validate.js');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
  	let type = req.params.type;
  	let path = `data_assets/`;
    cb(null, path);
  },
  filename: function (req, file, cb) {
  	let type = req.params.type;
  	let prefix = '';

  	switch(type) {
  		case 'imageCars' :
  			prefix = `${req.params.index}_`;
  			break;

  		default :
  			prefix = '';
  	}

    const timestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');

    cb(null, prefix + req.params.id_unit + '_' + timestamp.replace(/:| /gi, '_') + path.extname(file.originalname));
  }
})

const upload = multer({
	storage: storage,
	
    fileFilter: function(_req, file, cb){
        checkFileType(file, cb);
    }
});

function checkFileType(file, cb){
  // Allowed ext
  const filetypes = /jpeg|jpg|png/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null,true);
  } else {
    return cb(new ErrorResponse('Invalid filetypes!'));
  }
}

//validasi HP
exports.validationHp = (req, res, next) => {
	const hp = req.params.hp;
	const valData = {
		nomor_handphone: hp
	};

	let errors = validateHp(valData);
	if(errors) {
		return responseMessage(res, 200, '090', errors[0]);
	}else {

		const sql = `select id_user from tab_user where mobile_phone_number = "${hp}"`;

		validationHp(res, sql, next);
	}
}

//validasi Email
exports.validationEmail = (req, res, next) => {
	const email = req.params.email;
	const valData = {
		email: email
	};

	let errors = validateEmail(valData);
	if(errors) {
		return responseMessage(res, 200, '090', errors[0]);
	}else {

		const sql = `select id_user from tab_user where email = "${email}"`;

		validationEmail(res, sql, next);
	}
}

//create data
exports.registrasi = async (req, res, next) => {
	const data = { ...req.body }; //ambil data yang di POST
	let regisDate = new Date();
	regisDate = moment(regisDate, 'YYYY-MM-DD HH:mm:ss').format('YYYY/MM/DD HH:mm:ss');
	const id_user = 'USR' + Date.now(); //atur ID User menggunakan microtime
	const en_id_user = md5(id_user); //encrypt MD5 ID Buyer
	let password = '';
	password = (data.password !== undefined && data.password !== '') ? await hashPassword(data.password) : ''; //encrypt password menggunakan bcrypt

	//transform nama field untuk validasi
	const valData = {
	    nama: data.full_name,
	    nomor_handphone: data.mobile_phone_number,
	    email: data.email,
	    kata_sandi: data.password,
		kategori: data.id_category,
		nama_toko: data.outlet_name
	};

	//validasi
	let errors = validateUser(valData); //validasi input
	if(errors) {
		// return next(new ErrorResponse(errors[0], 400, '090'));
		return responseMessage(res, 200, '090', errors[0]);
	}

	//set params untuk insert ke table
	const params = {
		id_user: id_user,
		en_id_user: en_id_user,
		full_name: data.full_name,
		mobile_phone_number: data.mobile_phone_number,
		email: data.email,
		password: password,
		regis_date: regisDate,
		verified: false,
		id_role: 1,
		id_category: data.id_category,
		outlet_name: data.outlet_name,
		active: false
	};

	const id_outlet = 'OUT' + Date.now(); //atur ID Outlet menggunakan microtime
	const en_id_outlet = md5(id_outlet); //encrypt MD5 ID Outlet

	const sqlCheckHp = 'select * from tab_user where mobile_phone_number = ?'; //check nomor hp existing?
	const sqlCheckEmail = 'select * from tab_user where email = ?'; //check email existing?
	const insertUser = `insert into tab_user(id_user, en_id_user, full_name, mobile_phone_number, email, password, regis_date, verified, id_role)
	values("${id_user}", "${en_id_user}", "${data.full_name}", "${data.mobile_phone_number}", "${data.email}", "${password}", "${regisDate}", false, 1)`;

	const insertOutlet = `insert into tab_outlet(id_outlet, en_id_outlet, id_user, id_category, outlet_name, regis_date, active)
	values("${id_outlet}", "${en_id_outlet}", "${id_user}", ${data.id_category}, "${data.outlet_name}", "${regisDate}", false)`;

	registrasi(req, res, sqlCheckHp, sqlCheckEmail, insertUser, insertOutlet, params, next); //trigger function registrasi pada model
};

//verify email
exports.verifyEmail = async (req, res, next) => {
	const sqlCheck = 'select * from tab_user where en_id_user = ?';
	const sql = 'update tab_user set verified = true where en_id_user = ?';

	verifyEmail(res, sqlCheck, sql, req.params.id, next);
}

//login
exports.login = (req, res, next) => {
	const hp = req.params.hp;
	const pass = req.body.password;
	const fcmToken = req.body.fcmToken;

	const params = {
		hp: hp,
		pass: pass,
		fcmToken: fcmToken
	};

	const sql = `select * from tab_user
	JOIN tab_outlet ON tab_user.id_user = tab_outlet.id_user
	JOIN tab_category ON tab_outlet.id_category = tab_category.id_category
	where tab_user.mobile_phone_number = "${hp}"`;

	login(res, sql, params, next);
};

//logout
exports.logout = async (req, res, next) => {
	const data = { ...req.body };

	if(data.token) {
		const secret_key = await privateKey();

		try{
			const decoded = jwt.verify(data.token, secret_key, { algorithms: ['HS256'] }, function (err, payload) {
				//error handling
				if(err) {
					return next(new ErrorResponse(err, 500));
				}

				return(payload);
			});

			if(decoded) {
				if(decoded.data.id.substring(0, 3) !== 'USR') {
					return next(new ErrorResponse('Invalid token!', 401));
				}

				const sql = `update tab_user set login = false, fcm_token = null where tab_user.id_user = "${data.id_user}"`;

				logout(res, sql, next);
			}else {
				return next(new ErrorResponse('Invalid token!', 401));
			}
		}
		catch(errors) {
			return next(new ErrorResponse(errors, 500));
		}
	}else {
		return next(new ErrorResponse('Forbidden Access!', 400));
	}
};

//check Token
exports.checkToken= async (req, res, next) => {
	const data = { ...req.body };

	if(data.token) {
		const secret_key = await privateKey();

		try{
			const decoded = jwt.verify(data.token, secret_key, { algorithms: ['HS256'] }, function (err, payload) {
				if(err) {
					return next(new ErrorResponse(err, 500));
				}

				return(payload);
			});

			if(decoded) {
				const params_data = {
					id_user: decoded.data.id,
					fcm_token: decoded.data.fcmToken
				};

				const sql = `select * from tab_user where id_user = "${params_data.id_user}"`;

				checkToken(res, sql, params_data, next);
			}else {
				return next(new ErrorResponse('Invalid token!', 401));
			}
		}
		catch(errors) {
			return next(new ErrorResponse(errors, 500));
		}
	}else {
		return next(new ErrorResponse('Forbidden Access!', 400));
	}
}

//validasi Password
exports.validationPassword = (req, res, next) => {
	const data = { ...req.query };
	const pass = data.old_password;

	const sql = `select * from tab_user where id_user = "${req.params.id}"`;

	validationPassword(res, sql, pass, next);
}

//update Password
exports.updatePassword = async (req, res, next) => {
	const data = { ...req.body };

	if(data.token) {
		const secret_key = await privateKey();

		try{
			const decoded = jwt.verify(data.token, secret_key, { algorithms: ['HS256'] }, function (err, payload) {
				if(err) {
					return next(new ErrorResponse(err, 500));
				}

				return(payload);
			});

			if(decoded) {
				if(decoded.data.id.substring(0, 3) !== 'USR') {
					return next(new ErrorResponse('Invalid token!', 401));
				}

				const password = data.password !== '' ? await hashPassword(data.password) : '';
				const sql = `update tab_user set password = "${password}" where id_user = "${req.params.id}"`;

				updatePassword(res, sql, next);
			}else {
				return next(new ErrorResponse('Invalid token!', 401));
			}
		}
		catch(errors) {
			return next(new ErrorResponse(errors, 500));
		}
	}else {
		return next(new ErrorResponse('Forbidden Access!', 400));
	}
}

//update Data Outlet
exports.updateDataOutlet = async (req, res, next) => {
	const data = { ...req.body };

	if(data.token) {
		const secret_key = await privateKey();

		try{
			const decoded = jwt.verify(data.token, secret_key, { algorithms: ['HS256'] }, function (err, payload) {
				if(err) {
					return next(new ErrorResponse(err, 500));
				}

				return(payload);
			});

			if(decoded) {
				if(decoded.data.id.substring(0,3) !== 'USR') {
					return next(new ErrorResponse('Invalid token!', 401));
				}

				//validasi
				let errors = validateUpdateOutlet(data); //validasi input
				if(errors) {
					// return next(new ErrorResponse(errors[0], 400, '090'));
					return responseMessage(res, 200, '090', errors[0]);
				}

				const sql = `update tab_outlet set id_category = "${data.id_category}", address = "${data.address}",
				lat = "${data.lat}", lon = "${data.lon}" where id_user = "${data.id_user}"`;

				updateDataOutlet(res, sql, next);
			}else {
				return next(new ErrorResponse('Invalid token!', 401));
			}
		}
		catch(errors) {
			return next(new ErrorResponse(errors, 500));
		}
	}else {
		return next(new ErrorResponse('Forbidden Access!', 400));
	}
}
