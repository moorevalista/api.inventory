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
	


	
	
	
	// checkEmailForResetPassword,
	// getUser,
	// validateUpdateDataUser,
	// updateDataUser,
	// checkSellerAcc,
	// activateSeller,
	// addUnit,
	// uploadFoto,
} = require('../models/user-model');
const {
	validateUser,
	validateHp,
	validateEmail,
	validateUpdateOutlet,


	
	// validateUpdateUser,
	// validateSeller,
	// validateCarsUnit,
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
  		// case 'fotoKTPNakes' :
  		// 	prefix = 'KTP_';
  		// 	break;
  		// case 'fotoNPWPNakes' :
  		// 	prefix = 'NPWP_';
  		// 	break;
  		// case 'fotoSTRNakes' :
  		// 	prefix = 'STR_';
  		// 	break;
  		// case 'fotoSIPNakes' :
  		// 	prefix = 'SIP_';
  		// 	break;
  		default :
  			prefix = '';
  	}

    // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const timestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');

    cb(null, prefix + req.params.id_unit + '_' + timestamp.replace(/:| /gi, '_') + path.extname(file.originalname));
  }
})

const upload = multer({
	storage: storage,
	// limits: {
 //        fields: 5,
 //        fieldNameSize: 50, // TODO: Check if this size is enough
 //        fieldSize: 20000, //TODO: Check if this size is enough
 //        // TODO: Change this line after compression
 //        fileSize: 15000000, // 150 KB for a 1080x1080 JPG 90
 //    },
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
	// const regisDate = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''); //atur tanggal daftar
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






















//lupa Password
exports.forgotPassword = (req, res, next) => {
	const data = { ...req.body };
	const valData = {
		email: data.email
	};

	let errors = validateEmail(valData);
	if(errors) {
		return responseMessage(res, 200, '090', errors[0]);
	}else {
	
		const sql  = `select * from tab_user where email = "${data.email}"`;

		checkEmailForResetPassword(req, res, sql, data, next);
	}
}

//send Link for reset password
exports.sendLinkResetPassword = async (req, res, next) => {
	const token = await getToken(req, res, next);

	//send Email
	const params = {
		url: apiUrl() + 'api/user/reset_password/' + req.params_data.en_id_user + '/' + token,
		template: './template/email_forgot_password_user.html',
		subject: 'Reset Password',
		message: 'Tautan reset kata sandi berhasil dikirim!'
	};

	console.log('params : ', params);

	req.params_data = params;
	
	next();
}

//reset Password
exports.reset_password = async (req, res, next) => {
	res.redirect(`user.toge.co.id://resetPassword/${req.params.id}/${req.params.token}`);
}

//redirect Login
exports.redirectLogin = (req, res, next) => {
	res.redirect(`user.toge.co.id://`);
}

//get data User
exports.getUser = async (req, res, next) => {
	const token = req.query.token;

	if(token) {
		const secret_key = await privateKey();

		try{
			const decoded = jwt.verify(token, secret_key, { algorithms: ['HS256'] }, function (err, payload) {
			  //error handling
			  if(err) {
			  	return next(new ErrorResponse(err, 500));
			  }

			  return(payload);
			});

			// console.log('Decoded: ', decoded);

			if(decoded) {
				//jika ID pada token bukan NKS
				if(decoded.data.id.substring(0, 3) !== 'USR') {
					return next(new ErrorResponse('Invalid token!', 401));
				}

				const sql = `select * from tab_user LEFT JOIN tab_kelurahan ON tab_user.id_kelurahan = tab_kelurahan.id_kelurahan
				LEFT JOIN tab_kecamatan ON tab_kelurahan.id_kecamatan = tab_kecamatan.id_kecamatan
				LEFT JOIN tab_kota ON tab_kecamatan.id_kota = tab_kota.id_kota
				LEFT JOIN tab_provinsi ON tab_kota.id_provinsi = tab_provinsi.id_provinsi
				where tab_user.id_user = "${req.params.id_user}"`;

				getUser(res, sql, next);
			}else {
				return next(new ErrorResponse('Invalid token!', 401));
			}
		}
		catch(errors) {
			// console.log('Errors: ', errors);
			return next(new ErrorResponse(errors, 500));
		}
	}else {
		return next(new ErrorResponse('Forbidden Access!', 400));
	}
}

//validate update data Nakes
exports.validateUpdateDataUser = async (req, res, next) => {
	const data = { ...req.body };
	const en_id_user = req.params.id;

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

				const valData = {
					email: data.email,
					alamat: data.ktp_address,
					kelurahan: data.id_kelurahan,
					latitude: data.lat,
					longitude: data.lon,
				}

				//validasi
				let errors = validateUpdateUser(valData);
				if(errors) {
					return responseMessage(res, 200, '090', errors[0]);
				}else {
					// next();
					const sqlCheckEmailUser = `select id_user from tab_user where email = "${data.email}" and en_id_user <> "${en_id_user}"`;
					validateUpdateDataUser(res, sqlCheckEmailUser, next);
				}
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

//update data Nakes
exports.updateDataUser = (req, res, next) => {
	const data = { ...req.body };
	const en_id_user = req.params.id;

	const params = {
		en_id_user: en_id_user,
		email: data.email,
		ktp_address: data.ktp_address,
		id_kelurahan: data.id_kelurahan,
		lat: data.lat,
		lon: data.lon
	};

	updateDataUser(res, params, next);
}

//check Seller Account
exports.checkSellerAcc = async (req, res, next) => {
	const data = { ...req.query };

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

				const sql = `select * from tab_user where id_user = "${req.params.id}"`;

				checkSellerAcc(res, sql, next);
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

//activate Seller
exports.activateSeller = async (req, res, next) => {
	const data = { ...req.body }; //ambil data yang di POST

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

				// const regisDate = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''); //atur tanggal daftar
				let activated_date = new Date();
				activated_date = moment(activated_date, 'YYYY-MM-DD HH:mm:ss').format('YYYY/MM/DD HH:mm:ss');
				const id_seller = 'SLR' + Date.now(); //atur ID Seller menggunakan microtime
				const en_id_seller = md5(id_seller); //encrypt MD5 ID Buyer

				//transform nama field untuk validasi
				const valData = {
					nama_usaha: data.nama_usaha,
					kategori_usaha: data.kategori_usaha,
					jenis_usaha: data.id_jenis_usaha
				};

				//set params untuk insert ke table
				const params = {
					id_seller: id_seller,
					en_id_seller: en_id_seller,
					id_user: data.id_user,
					nama_usaha: data.nama_usaha,
					kategori_usaha: data.kategori_usaha,
					id_jenis_usaha: data.id_jenis_usaha,
					activated_date: activated_date,
					verified: true
				};

				const sqlExist = `select * from tab_seller where id_user = "${data.id_user}"`;
				const querySql = `insert into tab_seller set ?`; //insert new data

				//validasi
				let errors = validateSeller(valData); //validasi input
				if(errors) {
					// return next(new ErrorResponse(errors[0], 400, '090'));
					return responseMessage(res, 200, '090', errors[0]);
				}

				activateSeller(res, sqlExist, querySql, params, next); //trigger function registrasi pada model
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

//tambah unit
exports.addUnit = async (req, res, next) => {
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

				let uploadDate = new Date();
				uploadDate = moment(uploadDate, 'YYYY-MM-DD HH:mm:ss').format('YYYY/MM/DD HH:mm:ss');
				// const id_unit = 'CAR' + Date.now();
				const id_unit = data.id_unit;
				const en_id_unit = md5(id_unit);

				// console.log('PAJAK : ', moment(data.masa_pajak, 'YYYY/MM/DD').format('YYYY-MM-DD'));

				//set nama field untuk validasi
				const valData = {
					seller: data.id_seller,
					unit: id_unit,
					merk: data.id_brand,
					model: data.id_model,
					variant: data.variant,
					tahun_produksi: data.tahun_produksi,
					jenis_transmisi: data.transmisi,
					jenis_bahan_bakar: data.bahan_bakar,
					kapasitas_mesin: data.kapasitas_mesin,
					tipe_nomor_plat: data.plat_nomor,
					masa_berlaku_pajak: data.masa_pajak,
					jarak_tempuh: data.jarak_tempuh,
					tipe_registrasi: data.tipe_registrasi,
					warna_kendaraan: data.warna,
					kondisi_ac: data.kondisi_ac,
					usia_ban: data.usia_ban,
					kebocoran_oli: data.kebocoran_oli,
					kondisi_cat: data.kondisi_cat,
					kondisi_mesin: data.kondisi_mesin,
					nilai_jual: data.nilai_jual,
				};

				//set params untuk insert ke table
				const params = {
					id_seller: data.id_seller,
					id_unit: id_unit,
					en_id_unit: en_id_unit,
					tanggal_upload: uploadDate,
					// merk: data.id_brand,
					id_model: data.id_model,
					variant: data.variant,
					tahun_produksi: data.tahun_produksi,
					transmisi: data.transmisi,
					bahan_bakar: data.bahan_bakar,
					kapasitas_mesin: data.kapasitas_mesin,
					plat_nomor: data.plat_nomor,
					masa_pajak: data.masa_pajak,
					jarak_tempuh: data.jarak_tempuh,
					tipe_registrasi: data.tipe_registrasi,
					warna: data.warna,
					kondisi_ac: data.kondisi_ac,
					usia_ban: data.usia_ban,
					kebocoran_oli: data.kebocoran_oli,
					kondisi_cat: data.kondisi_cat,
					kondisi_mesin: data.kondisi_mesin,
					nilai_jual: data.nilai_jual,
					status: 'posted',
					active: true
				};

				const sql = `insert into tab_cars set ?`;

				//validasi
				let errors = validateCarsUnit(valData);
				if(errors) {
					return responseMessage(res, 200, '090', errors[0]);
				}

				addUnit(req, res, sql, params, next);
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

//upload image
const uploadFiles = upload.single('foto');

exports.uploadImages = (req, res, next) => {
  	uploadFiles(req, res, err => {
  		const data = { ...req.body };
		const type = req.params.type;
		const file = req.file;

	    if (err instanceof multer.MulterError) { // A Multer error occurred when uploading.
	      if (err.code === "LIMIT_UNEXPECTED_FILE") { // Too many images exceeding the allowed limit
	        // ...
	        return next(new ErrorResponse('Terjadi kesalahan!', 500));
	      }
	    } else if (err) {
	      return next(new ErrorResponse(err, 500));
	    }

	    // Everything is ok.
	    next();
	});
};

//resize image
exports.resizeImages = async (req, res, next) => {
	if (!req.file) return next();
	const file = req.file;

	await sharp(file.path)
		.resize(640, 320)
		// .toFormat(`${path.extname(file.originalname)}`)
		.jpeg({ quality: 90 })
		.toFile(`${file.destination}/${req.params.type}/${file.filename}`);

	fs.unlinkSync(req.file.path);

  	next();
};

//upload Foto
exports.uploadFoto = (req, res, next) => {
	const data = { ...req.body };
	const file = req.file;
	const id_unit = req.params.id_unit;
	const type = req.params.type;
	const indexFoto = req.params.index;

	let sql = '';
	switch(type) {
		case 'imageCars' :
			const id_images = 'IMG' + Date.now();
			sql = `insert into tab_images (id_images, id_unit, type, filename, index_foto, active) values
			("${id_images}", "${id_unit}", "mobil", "${file.filename}", "${indexFoto}", false)
			ON DUPLICATE KEY update filename = "${file.filename}"`;
			break;
		// case 'fotoKTPNakes' :
		// 	sql = `update tab_nakes set foto_ktp = "${file.filename}" where en_id_nakes = "${en_id_nakes}" and ktp_verified = false`;
		// 	break;
		// case 'fotoNPWPNakes' :
		// 	sql = `update tab_nakes set foto_npwp = "${file.filename}" where en_id_nakes = "${en_id_nakes}" and npwp_verified = false`;
		// 	break;
		// case 'fotoSTRNakes' :
		// const str_expired_date = req.params_data.str_expired_date;
		// 	sql = `update tab_nakes set foto_str = "${file.filename}", str_expired_date = "${str_expired_date}" where en_id_nakes = "${en_id_nakes}" and str_verified = false`;
		// 	break;
		// case 'fotoSIPNakes' :
		// 	const sip_expired_date = req.params_data.sip_expired_date;
		// 	sql = `update tab_nakes set foto_sip = "${file.filename}", sip_expired_date = "${sip_expired_date}" where en_id_nakes = "${en_id_nakes}" and sip_verified = false`;
		// 	break;
		default :
			sql = '';
	}

	const payload = {
		data: data,
		file: file,
		id_unit: id_unit,
		type: type,
		indexFoto: indexFoto
	};

	uploadFoto(req, res, sql, payload, next);
  	// responseMessage(res, 200, '000', 'Foto berhasil disimpan!');
}

exports.removePrevImage = (req, res, next) => {
	if (!req.file) {
		return responseMessage(res, 200, '000', 'Foto berhasil disimpan!');
	}
	const file = req.file;
	const payload = req.payload;
	const data = req.params_data;

	fs.unlinkSync(`${file.destination}${payload.type}/${data[0].filename}`);

	responseMessage(res, 200, '000', 'Foto berhasil disimpan!');
}




















//request OTP saat registrasi
exports.requestOTP = async (req, res, next) => {
	const prefix = req.params.hp.substring(0, 1);
	let noHp = ''

	if(prefix == 0) {
		noHp = '62' + req.params.hp.substring(1);
	}else {
		noHp = req.params.hp;
	}

	const otp = Math.floor(Math.random() * (999999 - 100000 + 1) ) + 100000;

	let pesan = "--Vissit.in--\r\n";
	pesan += "Kode OTP " + otp + ". Jangan berikan kode OTP kepada siapapun termasuk petugas Vissit.in.";

	const params = {
		phone: noHp,
		messageType: 'text',
		body: pesan
	};

	const params_data = JSON.stringify(params);

	let config = {
	  method: 'post',
	  url: 'https://sendtalk-api.taptalk.io/api/v1/message/send_whatsapp',
	  headers: { 
	    'API-Key': '2f87d53f37d75fd81cfe30231b3836904de546a33458614d1aaee18977124113', 
	    'Content-Type': 'application/json'
	  },
	  data : params_data
	};

	axios(config)
	.then(function (response) {
	  // console.log(JSON.stringify(response.data));
	  if(response.data.status === 200) {
	  	const id_otp = Date.now(); //id otp
	  	let datetime = new Date(); //otp datetime created
			let datetime_new = new Date(); //otp datetime expired
			datetime_new.setHours(datetime_new.getHours(), datetime_new.getMinutes()+5, datetime_new.getSeconds()); //otp datetime expired + 5 minutes

	  	const datetime_created = (moment(datetime, 'YYYY-MM-DD HH:mm:ss').format('YYYY/MM/DD HH:mm:ss')); //datetime created set format
	  	const datetime_expired = (moment(datetime_new, 'YYYY-MM-DD HH:mm:ss').format('YYYY/MM/DD HH:mm:ss')); //datetime expired set format

	  	const operation = 'registrasi';

	  	const sign_key = md5(req.params.hp + otp + operation + datetime_created + datetime_expired);

	  	const otpParams = {
	  		id_otp: id_otp,
	  		hp: req.params.hp,
	  		otp: otp,
	  		operation: operation,
	  		datetime_created: datetime_created,
	  		datetime_expired: datetime_expired,
	  		sign_key: sign_key
	  	};

	  	const sql = `insert into tab_otp(id_otp, no_hp, otp, operation, datetime_created, datetime_expired, sign_key)
	  	values(${otpParams.id_otp}, "${otpParams.hp}", "${otpParams.otp}", "${otpParams.operation}", "${otpParams.datetime_created}", "${otpParams.datetime_expired}", "${otpParams.sign_key}")`;

	  	insertOTP(res, sql, otpParams, next);
	  }else {
	  	return responseMessage(response, 200, '080', 'Gagal mengirim OTP!');
	  }
	})
	.catch(function (error) {
	  // console.log(error);
	  return next(new ErrorResponse(error, 500));
	});

}


//check OTP
exports.checkOTP = async (req, res, next) => {
	const data = { ...req.body };
	const datetime_now = moment(new Date(), 'YYYY-MM-DD HH:mm:ss').format('YYYY/MM/DD HH:mm:ss');

	const sign_key = md5(data.hp + data.otp + data.operation + data.datetime_created + data.datetime_expired);

	const sql = `select * from tab_otp where otp = "${data.otp}" and no_hp = "${data.hp}"
	and operation = "${data.operation}" and datetime_expired > "${datetime_now}" and sign_key = "${sign_key}" order by id_otp desc limit 1`;

	// const sql = `select * from tab_otp where otp = "${data.otp}" and no_hp = "${data.hp}"
	// and operation = "${data.operation}" and datetime_expired > "${datetime_now}" order by id_otp desc limit 1`;

	checkOTP(res, sql, next);
}

//validasi Email Update
exports.validationEmailUpdate = async (req, res, next) => {
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
				if(decoded.data.id.substring(0, 3) !== 'NKS') {
					return next(new ErrorResponse('Invalid token!', 401));
				}

				const sql = `select id from
											(select id_nakes as id from tab_nakes where email = "${data.email}" and en_id_nakes <> "${req.params.id}"
											UNION ALL
											select id_pasien as id from tab_pasien where email = "${data.email}"
											) email`;

				validationEmailUpdate(res, sql, next);
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

//reset Password
exports.resetPassword = async (req, res, next) => {
	const data = { ...req.body };

	if(data.token) {
		const secret_key = await privateKey();

		try{
			const decoded = jwt.verify(data.token, secret_key, { algorithms: ['HS256']}, function (err, payload) {
				if(err) {
					return next(new ErrorResponse(err, 500));
				}

				return(payload);
			});

			if(decoded) {
				if(decoded.data.id.substring(0, 3) !== 'NKS') {
					return next(new ErrorResponse('Invalid token!', 401));
				}

				const valData = {
					kata_sandi: data.password
				};

				let errors = validatePassword(valData);
				if(errors) {
					return responseMessage(res, 200, '090', errors[0]);
				}else {
					const password = await hashPassword(data.password)
					const sql = `update tab_nakes set password = "${password}" where en_id_nakes = "${data.en_id_nakes}"`;

					resetPassword(res, sql, next);
				}
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

//get data Profesi
exports.getProfesi = (req, res, next) => {
	const sql = `select id_profesi, profesi from tab_profesi`;

	getProfesi(res, sql, next);
}

//get data Bank
exports.getBank = (req, res, next) => {
	const sql = `select kode_bank, nama_bank, interbank_code, clearing_code, rtgs_code from tab_bank`;

	getBank(res, sql, next);
}

//get data Pendidikan
exports.getPendidikan = (req, res, next) => {
	const sql = `select id_pendidikan, pendidikan, jenjang from tab_pendidikan`;

	getPendidikan(res, sql, next);
}

//update Rekening
exports.updateRekening = async (req, res, next) => {
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
				if(decoded.data.id.substring(0, 3) !== 'NKS') {
					return next(new ErrorResponse('Invalid token!', 401));
				}

				const valData = {
					kode_bank: data.kode_bank,
					nomor_rekening: data.account_number
				};

				let errors = validateAccountNumber(valData);
				if(errors) {
					return responseMessage(res, 200, '090', errors[0]);
				}else {
					const sql = `update tab_nakes set kode_bank = "${data.kode_bank}", account_number = "${data.account_number}"
												where en_id_nakes = "${req.params.id}"`;

					updateRekening(res, sql, next);
				}
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

//update Pengalaman
exports.updateDataPengalamanNakes = async (req, res, next) => {
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
				if(decoded.data.id.substring(0, 3) !== 'NKS') {
					return next(new ErrorResponse('Invalid token!', 401));
				}

				const valData = {
					sertifikasi: data.sertifikasi,
					faskes: data.id_faskes
				};

				let errors = validateDataPengalaman(valData);
				if(errors) {
					return responseMessage(res, 200, '090', errors[0]);
				}else {
					const sql = `update tab_nakes set sertifikasi = "${data.sertifikasi}", id_faskes = "${data.id_faskes}", about_me ="${data.about_me}"
												where en_id_nakes = "${req.params.id}"`;

					updateDataPengalamanNakes(res, sql, next);
				}
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

//get Kategori Pasien
exports.getKategoriPasien = async (req, res, next) => {
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
				if(decoded.data.id.substring(0, 3) !== 'NKS') {
					return next(new ErrorResponse('Invalid token!', 401));
				}

				const sql = `select tab_kategori_pasien.*, IFNULL(tab_kategori_pasien_set.checked, 0) as checked from
											tab_kategori_pasien LEFT JOIN tab_kategori_pasien_set ON tab_kategori_pasien.id_kategori = tab_kategori_pasien_set.id_kategori
											and tab_kategori_pasien_set.id_nakes = "${data.id_nakes}" order by tab_kategori_pasien.id_kategori`;

				getKategoriPasien(res, sql, next);
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

//get Klasifikasi Pasien
exports.getKlasifikasiPasien = async (req, res, next) => {
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
				if(decoded.data.id.substring(0,3) !== 'NKS') {
					return next(new ErrorResponse('Invalid token!', 401));
				}

				const sql = `select tab_klasifikasi_pasien.id_klasifikasi, tab_klasifikasi_pasien.klasifikasi, tab_klasifikasi_pasien.deskripsi,
											IFNULL(tab_klasifikasi_pasien_set.checked, 0) as checked from
											tab_klasifikasi_pasien JOIN tab_profesi ON tab_klasifikasi_pasien.id_profesi = tab_profesi.id_profesi and tab_profesi.id_profesi = ${data.id_profesi}
											LEFT JOIN tab_klasifikasi_pasien_set ON tab_klasifikasi_pasien.id_klasifikasi = tab_klasifikasi_pasien_set.id_klasifikasi
											and tab_klasifikasi_pasien_set.id_nakes = "${data.id_nakes}" WHERE tab_klasifikasi_pasien.aktif = true order by tab_klasifikasi_pasien.id_klasifikasi`;

				getKlasifikasiPasien(res, sql, next);
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

//get Biaya Layanan
exports.getBiayaLayanan = async (req, res, next) => {
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
				if(decoded.data.id.substring(0, 3) !== 'NKS') {
					return next(new ErrorResponse('Invalid token!', 401));
				}

				const sql = `select tab_master_biaya.id_nakes, tab_master_biaya.biaya_layanan, tab_master_biaya.biaya_potongan from
											tab_master_biaya JOIN tab_nakes ON tab_master_biaya.id_nakes = tab_nakes.id_nakes
											and tab_nakes.id_nakes = "${data.id_nakes}" where tab_master_biaya.id_paket = 1`;

				getBiayaLayanan(res, sql, data, next);
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

//save Biaya Layanan
exports.saveLayananNakes = async (req, res, next) => {
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
				if(decoded.data.id.substring(0, 3) !== 'NKS') {
					return next(new ErrorResponse('Invalid token!', 401));
				}

				const valData = {
					biaya_layanan: data.biaya_layanan
				};

				let errors = validateLayananNakes(valData);
				if(errors) {
					return responseMessage(res, 200, '090', errors[0]);
				}else {
					const biaya_layanan = parseFloat(data.biaya_layanan);
					if(biaya_layanan < 250000) {
						responseMessage(res, 200, '091', 'Biaya layanan minimum Rp. 250.000!');
					}else {
						const params_data = {
							kategoriPilihan: data.kategoriPilihan,
							klasifikasiPilihan: data.klasifikasiPilihan,
							biaya_layanan: data.biaya_layanan,
							biaya_potongan: data.biaya_potongan !== '' ? data.biaya_potongan : 0,
							data_paket: data.data_paket
						};

						saveLayananNakes(res, params_data, req.params.id, next);
					}
				}
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

//save Jadwal Nakes
exports.saveJadwalNakes = async (req, res, next) => {
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
				if(decoded.data.id.substring(0, 3) !== 'NKS') {
					return next(new ErrorResponse('Invalid token!', 401));
				}

				const params_data = {
					jamPilihan: data.jamPilihan
				};

				saveJadwalNakes(res, params_data, req.params.id, next);
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

































