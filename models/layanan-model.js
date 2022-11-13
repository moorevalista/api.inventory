const connection = require('../config/database');
const { responseData, responseMessage, responseDataWithToken } = require('../utils/response-handler');
const ErrorResponse = require('../utils/errorResponse');
const {
	sendMail,
} = require('../utils/sendEmail');

const { apiUrl } = require('../helper/apiHelper');
const { privateKey } = require('../helper/auth');
var moment = require('moment');
var jwt = require('jsonwebtoken');
const { response } = require('express');
const { param } = require('../routes/layanan-router');

//get Provinsi
exports.getCategory = (response, sql, next) => {
	connection.query(sql, (err, rows, field) => {
		//error handling
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		//jika berhasil
		if(rows.length) {
			var provinsi = [];

			rows.forEach(key => {
				provinsi.push({
					id_category: key.id_category,
					category: key.category
				})
			});

			responseData(response, 200, '000', provinsi);
		}else {
			responseMessage(response, 200, '090', 'Gagal mendapatkan data!');
		}
	});
};

//get product category
exports.getProductCategory = (response, sql, next) => {
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

//add product category
exports.setProductCategory = (response, data, method, next) => {
	if(method === 'add') {
		const sql = `select * from tab_product_category where id_outlet = "${data.id_outlet}" order by id_product_category desc limit 1`;
		connection.query(sql, (err, rows, field) => {
			if(err) {
				return next(new ErrorResponse(err.message, 500));
			}

			var id_product_category = '';
			if(rows.length) {
				id_product_category = rows[0].id_product_category + 1;
			}else {
				id_product_category = 1;
			}

			const sql = `insert into tab_product_category(id_product_category, id_outlet, product_category)
			values(${id_product_category}, "${data.id_outlet}", "${data.product_category}")`;

			connection.query(sql, (err, rows, field) => {
				if(err) {
					return next(new ErrorResponse(err.message, 500));
				}

				if(rows.affectedRows > 0) {
					responseMessage(response, 200, '000', 'Data berhasil disimpan!');
				}else {
					responseMessage(response, 200, '090', 'Data gagal disimpan!');
				}
			});
		})
	}else if(method === 'edit') {
		const sql = `update tab_product_category set product_category = "${data.product_category}"
		where id_product_category = "${data.id_product_category}" and id_outlet = "${data.id_outlet}"`;

		connection.query(sql, (err, rows, field) => {
			if(err) {
				return next(new ErrorResponse(err.message, 500));
			}

			if(rows.affectedRows > 0) {
				responseMessage(response, 200, '000', 'Data berhasil disimpan!');
			}else {
				responseMessage(response, 200, '090', 'Data gagal disimpan!');
			}
		});
	}
	
}

//add product
exports.setProduct = (request, response, sql, data, method, next) => {
	connection.query(sql, data, (err, rows, field) => {
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.affectedRows > 0) {
			// responseMessage(response, 200, '000', 'Data berhasil disimpan!');
			request.payload = data;
			next()
		}else {
			responseMessage(response, 200, '090', 'Data gagal disimpan!');
		}
	});
}

//update log product
exports.updateLogProduct = (response, sql, data, method, next) => {
	// if(method !== 'editName') {
		connection.query(sql, data, (err, rows, field) => {
			if(err) {
				return next(new ErrorResponse(err.message, 500));
			}
	
			if(rows.affectedRows > 0) {
				responseMessage(response, 200, '000', 'Data berhasil disimpan!');
			}else {
				responseMessage(response, 200, '090', 'Data gagal disimpan!');
			}
		});
	// }else {
	// 	responseMessage(response, 200, '000', 'Data berhasil disimpan!');
	// }
}

//get product
exports.getProduct = (response, sql, next) => {
	connection.query(sql, (err, rows, field) => {
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.length) {
			responseData(response, 200, '000', rows);
		}else {
			responseMessage(response, 200, '090', 'Gagal mendapatkan data!');
		}
	});
}

//save transaksi
exports.saveTransaksi = (response, params, next) => {
	console.log(params);
	new Promise(async function (resolve, reject) {
		await params.items.map((i) => {
			const sql = `insert into tab_transaksi_detail(id_transaksi, id_product, qty, sub_total_price, sub_total_discount)
			values("${params.id_transaksi}", "${i.id_product}", ${i.qty}, ${i.sub_total_price}, ${i.sub_total_discount})`;
	
			connection.query(sql, (err, rows, field) => {
				if(err) {
					return next(new ErrorResponse(err.message, 500));
				}
	
				if(rows.affectedRows > 0) {
					resolve(rows.affectedRows);
				}
			});
		});
	})
	.then(function (result) {
		if(result > 0) {
			const sql = `insert into tab_transaksi(id_transaksi, id_outlet, trx_date, total_price, total_discount, payment)
			value("${params.id_transaksi}", "${params.id_outlet}", "${params.trx_date}", ${params.total_price}, ${params.total_discount}, ${params.payment})`;

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
	})
}


















//get Kota
exports.getKota = (response, sql, next) => {
	connection.query(sql, (err, rows, field) => {
		//error handling
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.length) {
			responseData(response, 200, '000', rows);
		}else {
			responseMessage(response, 200, '090', 'Gagal mendapatkan data!');
		}
	});
};

//get Kecamatan
exports.getKecamatan = (response, sql, next) => {
	connection.query(sql, (err, rows, field) => {
		//error handling
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.length) {
			responseData(response, 200, '000', rows);
		}else {
			responseMessage(response, 200, '090', 'Gagal mendapatkan data!');
		}
	});
};

//get Kelurahan
exports.getKelurahan = (response, sql, next) => {
	connection.query(sql, (err, rows, field) => {
		//error handling
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.length) {
			responseData(response, 200, '000', rows);
		}else {
			responseMessage(response, 200, '090', 'Gagal mendapatkan data!');
		}
	});
};

//get Jenis Usaha
exports.getJenisUsaha = (response, sql, next) => {
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

//get brand list
exports.getBrandList = (response, sql, next) => {
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

//get model list
exports.getModelList = (response, sql, next) => {
	connection.query(sql, (err, rows, field) => {
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.length) {
			responseData(response, 200, '000', rows);
		}else {
			responseMessage(response, 200, '090', 'Gagal mendapatlkan data!');
		}
	})
}

//get data unit
exports.getDataUnit = (response, sql, next) => {
	connection.query(sql, (err, rows, field) => {
		if(err) {
			return next(new ErrorResponse(err.message, 500));
		}

		if(rows.length) {
			new Promise(function (resolve, reject) {
				const sqlImage = `select * from tab_images where tab_images.active = true`;
				connection.query(sqlImage, (err, rowImages, field) => {
					if(err) {
						return next(new ErrorResponse(err.message, 500));
					}

					if(rowImages.length) {
						resolve([rows, rowImages]);
					}else {
						responseMessage(response, 200, '090', 'Gagal mendapatlkan data!');
					}
				})
			})
			.then(function (result) {
				let payload = [];
				result[0].forEach((key, index) => {
					const images = result[1].filter(item => item.id_unit === result[0][index].id_unit);

					payload.push({
						id_unit: key.id_unit,
						en_id_unit: key.en_id_unit,
						id_seller: key.id_seller,
						id_model: key.id_model,
						brand_name: key.brand_name,
						model_name: key.model_name,
						variant: key.variant,
						tahun_produksi: key.tahun_produksi,
						transmisi: key.transmisi,
						bahan_bakar: key.bahan_bakar,
						kapasitas_mesin: key.kapasitas_mesin,
						plat_nomor: key.plat_nomor,
						masa_pajak: key.masa_pajak,
						jarak_tempuh: key.jarak_tempuh,
						tipe_registrasi: key.tipe_registrasi,
						warna: key.warna,
						kondisi_ac: key.kondisi_ac,
						usia_ban: key.usia_ban,
						kebocoran_oli: key.kebocoran_oli,
						kondisi_cat: key.kondisi_cat,
						kondisi_mesin: key.kondisi_mesin,
						nilai_jual: key.nilai_jual,
						tanggal_upload: key.tanggal_upload,
						status: key.status,
						active: key.active,
						nama_seller: key.nama_usaha,
						nama_user: key.full_name,
						mobile_phone: key.mobile_phone_number,
						id_kota: key.id_kota,
						nama_kota: key.nama_kota,
						id_provinsi: key.id_provinsi,
						nama_provinsi: key.nama_provinsi,
						rowImages: images
					})
				})
				responseData(response, 200, '000', payload);
			})
		}else {
			responseMessage(response, 200, '090', 'Gagal mendapatkan data!');
		}
	})
}



















