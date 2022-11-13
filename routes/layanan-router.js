const {
	getCategory,
	getProductCategory,
	convertToken,
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
} = require('../controllers/layanan-controller');
const express = require('express');
const router = express.Router();

const {
	sendMail,
} = require('../utils/sendEmail');

router.route('/getCategory/')
	.get(getCategory);

router.route('/getProductCategory/:id')
	.get(getProductCategory);

router.route('/convertToken/')
	.post(convertToken);

router.route('/setProductCategory/:method/')
	.post(setProductCategory);

router.route('/setProduct/:method/')
	.post(setProduct, updateLogProduct);

router.route('/getProduct/')
	.post(getProduct);

router.route('/saveTransaksi/')
	.post(saveTransaksi);

// router.route('/getKota/:id')
// 	.get(getKota);

// router.route('/getKecamatan/:id')
// 	.get(getKecamatan);

// router.route('/getKelurahan/:id')
// 	.get(getKelurahan);

// router.route('/getJenisUsaha/')
// 	.get(getJenisUsaha);

// router.route('/getBrandList/')
// 	.get(getBrandList);

// router.route('/getModelList/:id')
// 	.get(getModelList);

// router.route('/getDataUnit/:id')
// 	.get(getDataUnit);

// router.route('/getDataListing/')
// 	.post(getDataListing);

//test send Email
router.route('/sendEmail/')
	.post(sendMail)

module.exports = router;