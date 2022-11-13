const {
	getCategory,
	getProductCategory,
	setProductCategory,
	setProduct,
	getProduct,
	updateLogProduct,
	saveTransaksi,


	// getKota,
	// getKecamatan,
	// getKelurahan,
	// getJenisUsaha,
	// getBrandList,
	// getModelList,
	// getDataUnit,
	// getDataListing,
} = require('../models/layanan-model');

const {
	validateAddProductCategory,
	validateEditProductCategory,
	validateAddProduct,
	validateEditProduct,
	validateEditProductName,

} = require('../utils/validation');

const ErrorResponse = require('../utils/errorResponse');
const { responseData, responseMessage, responseDataWithToken } = require('../utils/response-handler');

const { privateKey } = require('../helper/auth');
const md5 = require('md5');
var axios = require('axios');
var moment = require('moment');
var jwt = require('jsonwebtoken');
const { async } = require('validate.js');

//convert Token
exports.convertToken = async (req, res, next) => {
	const data = { ...req.body };

	const params = JSON.stringify({
		"application": "toge.co.id",
		"sandbox": true,
		"apns_tokens": [
			data.fcmToken
		]
	});

	let config = {
		method: 'post',
		url: 'https://iid.googleapis.com/iid/v1:batchImport',
		headers: {
			'Authorization': 'key=AAAAoWbogLI:APA91bEswcYEGtkg-AOKRGK-hbdWtYCyXLxNWIdJP4OI8iRWHqBMcUrPLflbGL3_I0BEJoSNkDXHVImyLab8D4ZWzbWHniy0k6v_47Mc6-UxpEyOTNC-EaXcJrEc3NQZQoJBTjhhguRn',
            'Content-Type': 'application/json'
		},
		data: params
	};

	axios(config)
	.then(function (response) {
		if(response.data.results[0].status === 'OK') {
			// console.log(response.data.results[0].registration_token);
			const payload = {
				registration_token: response.data.results[0].registration_token
			};
			
			responseData(res, 200, '000', payload);
		}else {
			return responseMessage(response, 200, '080', 'Terjadi Kesalahan!');
		}
	})
	.catch(function (error) {
		return next(new ErrorResponse(error, 500));
	});
};

//get Category
exports.getCategory = async (req, res, next) => {
	const sql = `select * from tab_category order by category asc`;

	getCategory(res, sql, next);
};

//get product category per outlet
exports.getProductCategory = async (req, res, next) => {
	const data = { ...req.query };

	if(data.token) {
		const secret_key = await privateKey();

		try{
			const decoded = jwt.verify(data.token, secret_key, { algorithms: ['HS256'] }, function (err, payload) {
				if(err) {
					return next(new ErrorResponse(err, 500));
				}

				return(payload);
			})

			if(decoded) {
				const sql = `select * from tab_product_category where id_outlet = "${req.params.id}"`;

				getProductCategory(res, sql, next);
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

//add product category
exports.setProductCategory = async (req, res, next) => {
	const data = { ...req.body };
	const method = req.params.method;

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
				let errors = ''
				//validasi
				if(method === 'add') {
					errors = validateAddProductCategory(data); //validasi input
				}else if(method === 'edit') {
					errors = validateEditProductCategory(data); //validasi input
				}
				
				if(errors) {
					// return next(new ErrorResponse(errors[0], 400, '090'));
					return responseMessage(res, 200, '090', errors[0]);
				}

				setProductCategory(res, data, method, next);
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

//add product
exports.setProduct = async (req, res, next) => {
	const data = { ...req.body }
	const method = req.params.method;

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
				if(method === 'add') {
					let input_date = new Date();
					input_date = moment(input_date, 'YYYY-MM-DD HH:mm:ss').format('YYYY/MM/DD HH:mm:ss');
					const id_product = 'PRD' + Date.now();
					const en_id_product = md5(id_product);

					//transform nama field untuk  validasi
					const valData = {
						nama_barang: data.product_name,
						kategori: data.id_product_category,
						harga: data.price,
						satuan_barang: data.unit,
						stok: data.stock
					};

					//validasi
					const errors = validateAddProduct(valData);

					if(errors) {
						return responseMessage(res, 200, '090', errors[0]);
					}

					//set params untuk insert ke table
					const params = {
						id_product: id_product,
						en_id_product: en_id_product,
						id_outlet: data.id_outlet,
						product_name: data.product_name,
						id_product_category: data.id_product_category,
						price: data.price,
						unit: data.unit,
						stock: data.stock,
						input_date: input_date,
						active: true
					};
		
					const sql = `insert into tab_product set ?`;

					setProduct(req, res, sql, params, method, next);
				}else if(method === 'edit') {
					//transform nama field untuk  validasi
					const valData = {
						stok: data.stock
					};

					//validasi
					const errors = validateEditProduct(valData);

					if(errors) {
						return responseMessage(res, 200, '090', errors[0]);
					}

					//set params untuk insert ke table
					const params = {
						id_product: data.id_product,
						id_outlet: data.id_outlet,
						stock: data.stock
					};

					const sql = `update tab_product set stock = stock + "${data.stock}" where id_product = "${data.id_product}"
					and id_outlet = "${data.id_outlet}"`;

					setProduct(req, res, sql, params, method, next);
				}else if(method === 'editReduce') {
					const valData = {
						stok: data.stock
					};

					const errors = validateEditProduct(valData);

					if(errors) {
						return responseMessage(res, 200, '090', errors[0]);
					}

					const params = {
						id_product: data.id_product,
						id_outlet: data.id_outlet,
						stock: data.stock,
						info: data.info
					};

					const sql = `update tab_product set stock = stock - "${data.stock}" where id_product = "${data.id_product}"
					and id_outlet = "${data.id_outlet}"`;

					setProduct(req, res, sql, params, method, next);
				}else if(method === 'editName') {
					const valData = {
						nama_barang: data.product_name
					};

					const errors = validateEditProductName(valData);

					if(errors) {
						return responseMessage(res, 200, '090', errors[0]);
					}

					const params = {
						id_product: data.id_product,
						id_outlet: data.id_outlet,
						product_name: data.product_name
					};

					const sql = `update tab_product set product_name = "${data.product_name}" where id_product = "${data.id_product}"
					and id_outlet = "${data.id_outlet}"`;

					setProduct(req, res, sql, params, method, next);
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
};

//update log product
exports.updateLogProduct = async (req, res, next) => {
	const data = { ...req.body };
	const method = req.params.method;
	const payload = req.payload;
	
	if(data.token) {
		const secret_key = await privateKey();

		try{
			const decoded = jwt.verify(data.token, secret_key, { algorithms: ['HS256'] }, function (err, payload) {
				if(err) {
					return next(new ErrorResponse(err, 500));
				}

				return(payload);
			})

			if(decoded) {
				let activity = '';
				let info = '';
				let qty = 0;
				switch(method) {
					case 'add':
						activity = 'in';
						info = 'Product Registration';
						qty = payload.stock;
						break;
					case 'edit':
						activity = 'in';
						info = 'Stock Update';
						qty = payload.stock;
						break;
					case 'editReduce':
						activity = 'out';
						info = payload.info;
						qty = payload.stock;
						break;
					case 'editName':
						activity = '-';
						info = 'Change Product Name';
						qty = 0;
						break;
				}

				let log_date = new Date();
				log_date = moment(log_date, 'YYYY-MM-DD HH:mm:ss').format('YYYY/MM/DD HH:mm:ss');
				const id_log = Date.now();

				const params = {
					id_log: id_log,
					id_product: payload.id_product,
					id_outlet: payload.id_outlet,
					activity: activity,
					qty: qty,
					info: info,
					log_date: log_date
				};

				const sql = `insert into tab_log_product set ?`;

				updateLogProduct(res, sql, params, method, next);
			}
		}
		catch(errors) {
			return next(new ErrorResponse(errors, 500));
		}
	}else {
		return next(new ErrorResponse('Forbidden Access!', 400));
	}
}

//get product list
exports.getProduct = async (req, res, next) => {
	const data = { ...req.body };

	if(data.token) {
		const secret_key = await privateKey();

		try{
			const decoded = jwt.verify(data.token, secret_key, { algorithms: ['HS256'] }, function (err, payload) {
				if(err) {
					return next(new ErrorResponse(err, 500));
				}

				return(payload);
			})

			if(decoded) {
				const sql = `select * from tab_product JOIN tab_product_category ON tab_product.id_product_category = tab_product_category.id_product_category
				and tab_product.id_outlet = "${data.id_outlet}" and tab_product.active = true`;

				getProduct(res, sql, next);
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

//simpan item transaksi
exports.saveTransaksi = async (req, res, next) => {
	const data = { ...req.body };
	const item = JSON.parse(data.items);
	// console.log(item[1]);

	if(data.token) {
		const secret_key = await privateKey();

		try{
			const decoded = jwt.verify(data.token, secret_key, { algorithms: ['HS256'] }, function (err, payload) {
				if(err) {
					return next(new ErrorResponse(err, 500));
				}

				return(payload);
			})

			if(decoded) {
				let trx_date = new Date();
				trx_date = moment(trx_date, 'YYYY-MM-DD HH:mm:ss').format('YYYY/MM/DD HH:mm:ss');
				const id_transaksi = 'TRX' + Date.now();

				let total_price = 0;
				let total_discount = 0;
				item.map((i) => {
					total_price = total_price + i.sub_total_price,
					total_discount = total_discount + i.sub_total_discount
				})
				
				const params = {
					id_transaksi: id_transaksi,
					id_outlet: data.id_outlet,
					trx_date: trx_date,
					total_price: total_price,
					total_discount: total_discount,
					payment: parseFloat(data.payment),
					items: item
				};
				
				saveTransaksi(res, params, next);
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


















//get Kota
exports.getKota = async (req, res, next) => {
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

			if(decoded) {
				const id_provinsi = req.params.id;
				const sql = `select * from tab_kota where id_provinsi = ${id_provinsi}`;

				getKota(res, sql, next);
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

//get Kecamatan
exports.getKecamatan = async (req, res, next) => {
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

			if(decoded) {
				const id_kota = req.params.id;
				const sql = `select * from tab_kecamatan where id_kota = "${id_kota}"`;

				getKecamatan(res, sql, next);
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

//get Kelurahan
exports.getKelurahan = async (req, res, next) => {
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

			if(decoded) {
				const id_kecamatan = req.params.id;
				const sql = `select * from tab_kelurahan where id_kecamatan = ${id_kecamatan}`;

				getKelurahan(res, sql, next);
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

//get Jenis Usaha
exports.getJenisUsaha = async (req, res, next) => {
	const token = req.query.token;

	if(token) {
		const secret_key = await privateKey();

		try{
			const decoded = jwt.verify(token, secret_key, { algorithms: ['HS256'] }, function (err, payload) {
				if(err) {
					return next(new ErrorResponse(err, 500));
				}

				return(payload);
			});

			if(decoded) {
				const sql = `select * from tab_jenis_usaha where active = true`;

				getJenisUsaha(res, sql, next);
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

//get brand list
exports.getBrandList = async (req, res, next) => {
	const token = req.query.token;

	if(token) {
		const secret_key = await privateKey();

		try{
			const decoded = jwt.verify(token, secret_key, { algorithms: ['HS256'] }, function (err, payload) {
				if(err) {
					return next(new ErrorResponse(err, 500));
				}

				return(payload);
			});

			if(decoded) {
				const sql = `select * from tab_brand where active = true`;

				getBrandList(res, sql, next);
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

//get model list
exports.getModelList = async (req, res, next) => {
	const token = req.query.token;
	const id = req.params.id;

	if(token) {
		const secret_key = await privateKey();

		try{
			const decoded = jwt.verify(token, secret_key, { algorithms: ['HS256'] }, function (err, payload) {
				if(err) {
					return next(new ErrorResponse(err, 500));
				}

				return(payload);
			});

			if(decoded) {
				const sql = `select * from tab_model where id_brand = ${id} and active = true`;

				getModelList(res, sql, next);
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

//get data Unit
exports.getDataUnit = async (req, res, next) => {
	const token = req.query.token;
	const id = req.params.id;
	const active = req.query.active;
	const id_jenis_usaha = req.query.id_jenis_usaha;

	if(token) {
		const secret_key = await privateKey();

		try{
			const decoded = jwt.verify(token, secret_key, { algorithms: ['HS256'] }, function (err, payload) {
				if(err) {
					return next(new ErrorResponse(err, 500));
				}

				return(payload);
			});

			if(decoded)  {
				switch(id_jenis_usaha) {
					case "1":
						console.log('ID : ', id_jenis_usaha);
						const sql = `select * from tab_cars
						JOIN tab_model ON tab_cars.id_model = tab_model.id_model
						JOIN tab_brand ON tab_model.id_brand = tab_brand.id_brand,
						tab_seller, tab_user
						JOIN tab_kelurahan ON tab_kelurahan.id_kelurahan = tab_user.id_kelurahan
						JOIN tab_kecamatan ON tab_kecamatan.id_kecamatan = tab_kelurahan.id_kecamatan
						JOIN tab_kota ON tab_kota.id_kota = tab_kecamatan.id_kota
						JOIN tab_provinsi ON tab_provinsi.id_provinsi = tab_kota.id_provinsi
						where tab_cars.id_seller = "${id}" and tab_cars.active = ${active}
						and tab_cars.id_seller = tab_seller.id_seller and tab_seller.id_user = tab_user.id_user`;

						getDataUnit(res, sql, next);
						break;
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

//get data Listing
exports.getDataListing = async (req, res, next) => {
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

			if(decoded)  {
				switch(data.kategori) {
					case "mobil":
						const sql = `select * from tab_cars
						JOIN tab_model ON tab_cars.id_model = tab_model.id_model
						JOIN tab_brand ON tab_model.id_brand = tab_brand.id_brand,
						tab_seller, tab_user
						JOIN tab_kelurahan ON tab_kelurahan.id_kelurahan = tab_user.id_kelurahan
						JOIN tab_kecamatan ON tab_kecamatan.id_kecamatan = tab_kelurahan.id_kecamatan
						JOIN tab_kota ON tab_kota.id_kota = tab_kecamatan.id_kota
						JOIN tab_provinsi ON tab_provinsi.id_provinsi = tab_kota.id_provinsi
						where tab_cars.active = true`;

						getDataUnit(res, sql, next);
						break;
					default:
						return next(new ErrorResponse('Kategori tidak ditemukan!', 500));
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














































