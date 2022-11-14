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
