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



















//check Email for reset password
exports.checkEmailForResetPassword = (request, response, sql, data, next) => {
	connection.query(sql, (err, rows, field) => {
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.length) {
			const params = {
				id_user: rows[0].id_user,
				en_id_user: rows[0].en_id_user,
				nama_user: rows[0].full_name,
				hp: rows[0].mobile_phone_number
			}

			request.payload = data;
			request.params_data = params;

			// responseMessage(response, 200, '000', 'Validation OK!');
			next();
		}else {
			responseMessage(response, 200, '010', 'Email tidak ditemukan!');
		}
	})
}

//get user data
exports.getUser = (response, sql, next) => {
	connection.query(sql, (err, rows, field) => {
		//error handling
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		//jika berhasil
		if(rows.length) {
			const data = {
				id_user: rows[0].id_user,
				en_id_user: rows[0].en_id_user,
				full_name: rows[0].full_name,
				hp: rows[0].mobile_phone_number,
				email: rows[0].email,
				ktp_address: rows[0].ktp_address,
				id_provinsi: rows[0].id_provinsi,
				nama_provinsi: rows[0].nama_provinsi,
				id_kota: rows[0].id_kota,
				nama_kota: rows[0].nama_kota,
				id_kecamatan: rows[0].id_kecamatan,
				nama_kecamatan: rows[0].nama_kecamatan,
				id_kelurahan: rows[0].id_kelurahan,
				nama_kelurahan: rows[0].nama_kelurahan,
				kodepos: rows[0].kodepos,
				lat: rows[0].lat,
				lon: rows[0].lon,
				regisDate: rows[0].regisDate,
				verified: rows[0].verified,
				foto_profile: rows[0].foto_profile,
				seller_active: rows[0].seller_active
			};

			responseData(response, 200, '000', data);
		}else {
			responseMessage(response, 200, '001', 'Data User tidak ditemukan!');
		}
		
	});
};

//validate Update Data Nakes
exports.validateUpdateDataUser = (response, sqlCheckEmailUser, next) => {
	connection.query(sqlCheckEmailUser, (err, rows, field) => {
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.length) {
			responseMessage(response, 200, '090', 'Email sudah terdaftar!');
		}else {
			next();
		}
	})
}

//update Data Nakes
exports.updateDataUser = (response, data, next) => {
	const updateDataUser = `update tab_user set email = "${data.email}",
		ktp_address = "${data.ktp_address}", id_kelurahan = "${data.id_kelurahan}",
		lat = "${data.lat}", lon = "${data.lon}"
		where en_id_user = "${data.en_id_user}"`;

	connection.query(updateDataUser, (err, rows, field) => {
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.affectedRows > 0) {
			responseMessage(response, 200, '000', 'Update data berhasil!');
		}else {
			responseMessage(response, 200, '090', 'Update data gagal!');
		}
	})
}

//check Seller Account
exports.checkSellerAcc = (response, sql, next) => {
	connection.query(sql, (err, rows, field) => {
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.length) {
			responseData(response, 200, '000', rows);
		}else {
			responseMessage(response, 200, '001', 'Data tidak ditemukan!');
		}
	})
}

//activate Seller
exports.activateSeller = (response, sqlCheck, insertStatement, data, next) => {
	connection.query(sqlCheck, (err, rows, field) => {
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.length) {
			responseMessage(response, 200, '090', 'Akun Penjual sudah pernah diaktifkan!');
		}else {
			//insert data ke table Seller
			connection.query(insertStatement, data, (err, rows, field) => {
				//error handling
				if(err) {
					return next(new ErrorResponse(err.message, 500));
				}

				//jika berhasil
				if(rows.affectedRows > 0) {
					const sql = `update tab_user set seller_active = true where id_user = "${data.id_user}"`;

					connection.query(sql, (err, rows, field) => {
						if(err) {
							return next(new ErrorResponse(err.message, 500));
						}

						if(rows.affectedRows > 0) {
							// responseMessage(response, 200, '000', 'Aktifasi Akun Penjual berhasil!' );

							const payload = {
								id_seller: data.id_seller,
								id_jenis_usaha: data.id_jenis_usaha,
								message: 'Aktifasi Akun Penjual berhasil!'
							};

							responseData(response, 200, '000', payload);
						}else {
							responseMessage(response, 200, '090', 'Terjadi kesalahan!' );
						}
					});
				}else {
					responseMessage(response, 200, '090', 'Aktifasi Akun Penjual gagal!' );
				}
			});
		}
	})
};

exports.addUnit = (request, response, sql, data, next) => {
	connection.query(sql, data, (err, rows, field) => {
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}
		
		if(rows.affectedRows > 0) {
			const updateSql = `update tab_images set active = true where id_unit = "${data.id_unit}"`;

			connection.query(updateSql, (err, rows, field) => {
				if(err) {
					return next(new ErrorResponse(err.message, 500));
				}

				responseMessage(response, 200, '000', 'Data unit berhasil disimpan!');
			})
		}else {
			responseMessage(response, 200, '090', 'Data unit gagal disimpan!');
		}
	});
}

//upload Foto Profile
exports.uploadFoto = (request, response, sql, data, next) => {
	const sqlCheck = `select * from tab_images where id_unit = "${data.id_unit}" and index_foto = "${data.indexFoto}" limit 1`;

	connection.query(sqlCheck, (err, rows, field) => {
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.length) {
			request.payload = data;
			request.params_data = rows;

			connection.query(sql, (err, rows, field) => {
				if(err) {
					return next(new ErrorResponse(err.message, 500));
				}
		
				if(rows.affectedRows > 0) {
					next();	
					// responseMessage(response, 200, '000', 'Foto berhasil disimpan!');
				}else {
					responseMessage(response, 200, '090', 'Foto gagal disimpan!');
				}
			});
		}else {
			connection.query(sql, (err, rows, field) => {
				if(err) {
					return next(new ErrorResponse(err.message, 500));
				}
		
				if(rows.affectedRows > 0) {
					// next();	
					responseMessage(response, 200, '000', 'Foto berhasil disimpan!');
				}else {
					responseMessage(response, 200, '090', 'Foto gagal disimpan!');
				}
			});
		}
	});
}

































exports.insertOTP = (response, sql, data, next) => {
	connection.query(sql, (err, rows, field) => {
		//error handling
		if(err) {
			return next(new ErrorResponse(err.message), 500);
		}

		//jika berhasil
		if(rows.affectedRows > 0) {
			const payload = {
				operation: data.operation,
				datetime_created: data.datetime_created,
				datetime_expired: data.datetime_expired
			};

			responseData(response, 200, '000', payload);
		}else {
			responseMessage(response, 200, '080', 'Gagal mengirim OTP!');
		}
	});
};

exports.checkOTP = (response, sql, next) => {
	connection.query(sql, (err, rows, field) => {
		//error handling
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		//jika berhasil
		if(rows.length) {
			responseMessage(response, 200, '000', 'OTP valid!');
		}else {
			responseMessage(response, 200, '088', 'OTP tidak valid!');
		}
	});
};

//validasi Email Update
exports.validationEmailUpdate = (response, sql, next) => {
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

//reset Password
exports.resetPassword = (response, sql, next) => {
	connection.query(sql, (err, rows, field) => {
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.affectedRows > 0) {
			responseMessage(response, 200, '000', 'Kata sandi berhasil dipulihkan!');
		}else {
			responseMessage(response, 200, '090', 'Kata sandi gagal dipulihkan!');
		}
	})
}

//get data Profesi
exports.getProfesi = (response, sql, next) => {
	connection.query(sql, (err, rows, field) =>  {
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.length) {
			responseData(response, 200, '000', rows);
		}else {
			responseMessage(response, 200, '001', 'Gagal mendapatkan data!');
		}
	})
}

//get data Bank
exports.getBank = (response, sql, next) => {
	connection.query(sql, (err, rows, field) => {
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.length) {
			responseData(response, 200, '000', rows);
		}else {
			responseMessage(response, 200, '001', 'Gagal mendapatkan data!');
		}
	})
}

//get data Pendidikan
exports.getPendidikan = (response, sql, next) => {
	connection.query(sql, (err, rows, field) => {
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.length) {
			responseData(response, 200, '000', rows);
		}else {
			responseMessage(response, 200, '001', 'Gagal mendapatkan data!');
		}
	})
}

//update Rekening
exports.updateRekening = (response, sql, next) => {
	connection.query(sql, (err, rows, field) => {
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.affectedRows > 0) {
			responseMessage(response, 200, '000', 'Rekening berhasil diperbarui!');
		}else {
			responseMessage(response, 200, '090', 'Rekening gagal diperbarui!');
		}
	})
}

//update data Pengalaman
exports.updateDataPengalamanNakes = (response, sql, next) => {
	connection.query(sql, (err, rows, field) => {
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.affectedRows > 0) {
			responseMessage(response, 200, '000', 'Berhasil menyimpan data!');
		}else {
			responseMessage(response, 200, '090', 'Gagal menyimpan data!');
		}
	})
}

//get Katefori Pasien
exports.getKategoriPasien = (response, sql, next) => {
	connection.query(sql, (err, rows, field) => {
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.length) {
			responseData(response, 200, '000', rows);
		}else {
			responseMessage(response, 200, '090', 'Gagal mendapatkan data!');
		}
	})
}

//get Klasifikasi Pasien
exports.getKlasifikasiPasien = (response, sql, next) => {
	connection.query(sql, (err, rows, field) => {
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.length) {
			responseData(response, 200, '000', rows);
		}else {
			responseMessage(response, 200, '090', 'Gagal mendapatkan data!');
		}
	})
}

//get Biaya Layanan
exports.getBiayaLayanan = (response, sql, data, next) => {
	connection.query(sql, (err, rows, field) => {
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.length) {
			responseData(response, 200, '000', rows[0]);
		}else {
			const params_data = {
				id_nakes: data.id_nakes,
				biaya_layanan: '',
				biaya_potongan: ''
			};

			responseData(response, 200, '000', params_data);
		}
	})
}

//save Layanan Nakes
exports.saveLayananNakes = async (response, data, id, next) => {
	const kategori = JSON.parse(data.kategoriPilihan);
	let jmlKat = kategori.length;
	const klasifikasi = JSON.parse(data.klasifikasiPilihan);
	let jmlKlas = klasifikasi.length;
	const biaya_layanan = parseFloat(data.biaya_layanan);
	const biaya_potongan = parseFloat(data.biaya_potongan);
	const data_paket = JSON.parse(data.data_paket);
	let jmlPaket = 0;
	// let i = 0;
	let affectedRows = [];

	const sql = `select id_nakes from tab_nakes where id_nakes = "${id}"`;

	connection.query(sql, (err, rows, field) => {
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.length) {
			new Promise(function (resolve, reject) {
				if(data_paket) {
					jmlPaket = data_paket.length;
				}

				if(jmlPaket > 0) {
					let i = 0;
					for(i=0; i<jmlPaket; i++) {
						if(data_paket[i].id_paket !== undefined && data_paket[i].id_paket !== '') {
							const paket = {
								id_nakes: id,
								id_paket: data_paket[i].id_paket,
								biaya_layanan: (data_paket[i].biaya_layanan !== '' && data_paket[i].biaya_layanan !== null) ? parseFloat(data_paket[i].biaya_layanan) : 0,
								biaya_potongan: (data_paket[i].biaya_potongan !== '' && data_paket[i].biaya_potongan !== null) ? parseFloat(data_paket[i].biaya_potongan) : 0,
								active: (data_paket[i].active !== '' && data_paket[i].active !== null) ? data_paket[i].active : 0
							};

							const sql = `insert into tab_master_biaya(id_nakes,id_paket,biaya_layanan,biaya_potongan,active)
											values("${id}", ${paket.id_paket}, ${paket.biaya_layanan}, ${paket.biaya_potongan}, ${paket.active})
											ON DUPLICATE KEY UPDATE biaya_layanan = ${paket.biaya_layanan}, biaya_potongan = ${paket.biaya_potongan}, active = ${paket.active}`;


							connection.query(sql, (err, rows, field) => {
								if(err) {
									return next(new ErrorResponse(err.message, 500));
								}

								if(rows.affectedRows > 0) {
									resolve(rows.affectedRows);
								}
							});
						}
					}
				}
			})
			.then(function (result) {
				affectedRows.push(result);
				// console.log(affectedRows);
				return new Promise((resolve, reject) => {
					let i = 0;
					for(i=0; i<jmlKat; i++) {
						const checked = kategori[i].checked ? 1 : 0;
						const sql = `insert into tab_kategori_pasien_set(id_nakes,id_kategori,checked)
									values ("${id}", ${kategori[i].id_kategori}, ${checked})
		                			ON DUPLICATE KEY UPDATE checked = ${checked}`;

		                connection.query(sql, (err, rows, field) => {
		                	if(err) {
		                		return next(new ErrorResponse(err.message, 500));
		                	}

		                	if(rows.affectedRows > 0) {
		                		resolve(rows.affectedRows);
		                	}
		                });
					}
				})
			})
			.then(function (result) {
				affectedRows.push(result);
				return new Promise((resolve, reject) => {
					let i = 0;
					for(i=0; i<jmlKlas; i++) {
						const checked = klasifikasi[i].checked ? 1 : 0;
						const sql = `insert into tab_klasifikasi_pasien_set(id_nakes,id_klasifikasi,checked)
										values ("${id}", ${klasifikasi[i].id_klasifikasi}, ${klasifikasi[i].checked})
		                				ON DUPLICATE KEY UPDATE checked = ${checked}`;

		                connection.query(sql, (err, rows, field) => {
		                	if(err) {
		                		return next(new ErrorResponse(err.message, 500));
		                	}

		                	if(rows.affectedRows > 0) {
		                		resolve(rows.affectedRows);
		                	} 
		                });
					}
				})
			})
			.then(function (result) {
				affectedRows.push(result);
				return new Promise((resolve, reject) => {
					const sql = `insert into tab_master_biaya (id_nakes, id_paket, biaya_layanan, biaya_potongan, active)
									values ("${id}", 1, ${biaya_layanan}, ${biaya_potongan}, 1)
			            			ON DUPLICATE KEY UPDATE biaya_layanan = ${biaya_layanan}, biaya_potongan = ${biaya_potongan}`;

			        connection.query(sql, (err, rows, field) => {
			        	if(err) {
			        		return next(new ErrorResponse(err.message, 500));
			        	}

			        	if(rows.affectedRows > 0) {
			        		resolve(rows.affectedRows);
			        	} 
			        });
				})
			})
			.then(function (result) {
				affectedRows.push(result);
				if(affectedRows.length > 0) {
					responseMessage(response, 200, '000', 'Berhasil menyimpan data!');
				}else {
					responseMessage(response, 200, '090', 'Gagal menyimpan data!');
				}
			})
			.catch(function (error) {
				return next(new ErrorResponse(error, 500));
			})
		}else {
			responseMessage(response, 200, '090', 'User tidak ditemukan!');
		}
	})
}

//save Jadwal Nakes
exports.saveJadwalNakes = async (response, data, id, next) => {
	
}

















