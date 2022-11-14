const connection = require('../config/database');
const { responseData, responseMessage, responseDataWithToken } = require('../utils/response-handler');
const ErrorResponse = require('../utils/errorResponse');
// const {
// 	sendMail,
// } = require('../utils/sendEmail');

const { apiUrl } = require('../helper/apiHelper');
const { privateKey, getToken } = require('../helper/auth');
var moment = require('moment');
var jwt = require('jsonwebtoken');
const { hashPassword, comparePassword } = require('../utils/hashPassword');
const { request } = require('express');

//validasi HP
exports.validationHp = (response, sql, next) => {
	connection.query(sql, (err, rows, field) => {
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.length) {
			responseMessage(response, 200, '010', 'Nomor Handphone sudah terdaftar!');
		}else {
			responseMessage(response, 200, '000', 'Validation OK!');
		}
	})
}

//validasi Email
exports.validationEmail = (response, sql, next) => {
	connection.query(sql, (err, rows, field) => {
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.length) {
			responseMessage(response, 200, '010', 'Email sudah terdaftar!');
		}else {
			responseMessage(response, 200, '000', 'Validation OK!');
		}
	})
}

//create user data
exports.registrasi = (request, response, sqlCheckHp, sqlCheckEmail, insertUser, insertOutlet, data, next) => {
	//check apakah nomor hp terdaftar
	connection.query(sqlCheckHp, data.mobile_phone_number, (err, rows, field) => {
		//error handling
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.length) {
			responseMessage(response, 200, '010', 'Nomor Handphone sudah terdaftar!' );
		}else {
			//check apakah email terdaftar
			connection.query(sqlCheckEmail, data.email, (err, rows, field) => {
				//error handling
				if(err) {
					return next(new ErrorResponse(err.message, 500));
				}

				if(rows.length) {
					responseMessage(response, 200, '010', 'Email sudah terdaftar!' );
				}else {
					//insert data ke table User
					connection.query(insertUser, (err, rows, field) => {
						//error handling
						if(err) {
							return next(new ErrorResponse(err.message, 500));
						}

						connection.query(insertOutlet, (err, rows, field) => {
							if(err) {
								return next(new ErrorResponse(err.message, 500));
							}

							//jika berhasil
							//send Email
							const params = {
								url: apiUrl() + 'api/user/verifyEmail/' + data.en_id_user,
								template: './template/email_registrasi_user.html',
								subject: 'Registrasi Akun',
								message: 'Registrasi berhasil!'
							};

							request.payload = data;
							request.params_data = params;
							
							next();
							// sendMail(data, params);
							// responseMessage(response, 200, '000', 'Registrasi berhasil!' );
						})
					})
				}
			})
		}
	});
};

//verify email
exports.verifyEmail = (response, sqlCheck, sql, id, next) => {
	connection.query(sqlCheck, id, (err, rows, field) => {
		//error handling
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		//jika data ditemukan
		if(rows.length) {
			const id_user = rows[0].id_user;
			// console.log('data : ', rows[0].verified);
			if(rows[0].verified === 0) {
				connection.query(sql, id, (err, rows, field) => {
					//error handling
					if(err) {
						return next(new ErrorResponse(err.message, 500));
					}

					//jika berhasil
					// console.log(rows);
					if(rows.affectedRows > 0) {
						// responseMessage(response, 200, '000', 'Verifikasi email berhasil!');
						const sql = 'update tab_outlet set active = true where id_user = ?';
						connection.query(sql, id_user, (err, rows, field) => {
							if(err) {
								return next(new ErrorResponse(err.message, 500));
							}

							if(rows.affectedRows > 0) {
								next();
							}else {
								responseMessage(response, 200, '091', 'Terjadi Kesalahan!');
							}
						})
					}else {
						responseMessage(response, 200, '091', 'Verifikasi email gagal!');
					}
				});
			}else {
				// responseMessage(response, 200, '000', 'Email sudah terverifikasi!');

				next();
			}
		}else {
			responseMessage(response, 200, '001', 'Email tidak ditemukan!');
		}
	});
};

//login
exports.login = (response, sql, data, next) => {
	connection.query(sql, (err, rows, field) => {
		//error handling
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}
		
		//jika data ditemukan
		if(rows.length) {
			const password = rows[0].password;

			const payload = {
				id_user: rows[0].id_user,
				en_id_user: rows[0].en_id_user,
				nama_user: rows[0].full_name,
				hp: rows[0].mobile_phone_number,
				email: rows[0].email,
				id_outlet: rows[0].id_outlet,
				nama_outlet: rows[0].outlet_name,
				id_kategori: rows[0].id_category.toString(),
				kategori: rows[0].category,
				address: rows[0].address !== null ? rows[0].address : '',
				verified: rows[0].verified,
			};

			if(payload.verified) {
				comparePassword(data.pass, password)
				.then(function(result) {
				   if(result) {
				   		// console.log('BENAR');
				   		const secret_key = privateKey();
				   		const issuer_claim = 'https://toge.co.id';
				   		const audience_claim = 'https://api.toge.co.id';
				   		const issuedat_claim = Math.floor(new Date().getTime() / 1000);
				   		const notbefore_claim = issuedat_claim + 0;
				   		const expire_claim = issuedat_claim + 3600;

				   		const paramsToken = {
				   			iss: issuer_claim,
				   			aud: audience_claim,
				   			iat: issuedat_claim,
				   			data: {
				   				id: payload.id_user,
				   				nama_user: payload.nama_user,
				   				hp: payload.hp,
								// nama_outlet: payload.nama_outlet,
				   				fcmToken: data.fcmToken
				   			}
				   		};

				   		const token = jwt.sign(paramsToken, secret_key);

				   		const setLogin = `update tab_user set login = true, fcm_token = "${data.fcmToken}" where tab_user.id_user = "${payload.id_user}"`;

				   		connection.query(setLogin, (err, rows, field) => {
				   			if(err) {
				   				return next(new ErrorResponse(err.message, 500));
				   			}

				   			if(rows.affectedRows > 0) {
				   				responseDataWithToken(response, 200, '000', 'Login berhasil!', token, payload);
				   			}else {
								responseDataWithToken(response, 200, '003', 'Login gagal!', '', payload);
							}
				   		});
				   }else {
				   		responseDataWithToken(response, 200, '003', 'Login gagal!', '', payload);
				   		// console.log('SALAH');
				   }
				})
				.catch(function (error) {
				  // console.log(error);
				  return next(new ErrorResponse(error, 500));
				});

			}else {
				responseMessage(response, 200, '004', 'Anda belum melakukan verifikasi email!' );
			}
		}else {
			responseMessage(response, 200, '002', 'Login gagal!' );
		}
	});
};

//logout
exports.logout = (response, sql, next) => {
	connection.query(sql, (err, rows, field) => {
		//error handling
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.affectedRows > 0) {
			responseMessage(response, 200, '000', 'Anda sudah keluar!');
		}else {
			responseMessage(response, 200, '003', 'Terjadi kesalahan!');
		}
	});
};

//checkToken
exports.checkToken = (response, sql, data, next) => {
	connection.query(sql, (err, rows, field) => {
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.length) {
			if(rows[0].fcm_token === data.fcm_token) {
				responseMessage(response, 200, '000', 'Sukses!');
			}else {
				responseMessage(response, 200, '999', 'Gagal!')
			}
		}else {
			responseMessage(response, 200, '090', 'Data tidak ditemukan!');
		}
	});
};

//validasi Password
exports.validationPassword = (response, sql, pass, next) => {
	connection.query(sql, (err, rows, field) => {
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.length) {
			const password = rows[0].password;

			comparePassword(pass, password)
			.then(function(result) {
				if(result) {
					responseMessage(response, 200, '000', 'Validation OK!');
				}else {
					responseMessage(response, 200, '011', 'Kata sandi tidak sesuai!');
				}
			})
		}else {
			responseMessage(response, 200, '001', 'Terjadi kesalahan!');
		}
	})
}

//update Password
exports.updatePassword = (response, sql, next) => {
	connection.query(sql, (err, rows, field) => {
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.affectedRows > 0) {
			responseMessage(response, 200, '000', 'Kata sandi berhasil diperbarui!');
		}else {
			responseMessage(response, 200, '090', 'Kata sandi gagal diperbarui!');
		}
	})
}

//update Data Outlet
exports.updateDataOutlet = (response, sql, next) => {
	connection.query(sql, (err, rows, field) => {
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.affectedRows > 0) {
			responseMessage(response, 200, '000', 'Data berhasil disimpan!');
		}else {
			responseMessage(response, 200, '090', 'Data gagal disimpan!');
		}
	})
}
