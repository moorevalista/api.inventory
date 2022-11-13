const {
	registrasi,
	validationHp,
	validationEmail,
	verifyEmail,
	redirectLogin,
	login,
	logout,
	checkToken,
	validationPassword,
	updatePassword,
	updateDataOutlet,


	
	
	
	// forgotPassword,
	// sendLinkResetPassword,
	// reset_password,
	// getUser,
	// validateUpdateDataUser,
	// updateDataUser,
	// checkSellerAcc,
	// activateSeller,
	// addUnit,
	// uploadImages,
	// resizeImages,
	// uploadFoto,
	// removePrevImage,

} = require('../controllers/user-controller');
const express = require('express');
const router = express.Router();

const {
	sendMail,
} = require('../utils/sendEmail');
// const { uploadFoto } = require('../models/user-model');

router.route('/registrasi/')
	.post(registrasi, sendMail);

router.route('/validationHp/:hp')
	.post(validationHp);

router.route('/validationEmail/:email')
	.post(validationEmail);

router.route('/verifyEmail/:id')
	.get(verifyEmail, redirectLogin);

router.route('/login/:hp')
	.post(login);

router.route('/logout/')
	.post(logout);

router.route('/checkToken/')
	.post(checkToken);

router.route('/validationPassword/:id')
	.get(validationPassword);

router.route('/updatePassword/:id')
	.post(updatePassword);

router.route('/updateDataOutlet/')
	.post(updateDataOutlet);


// router.route('/forgotPassword/')
// 	.post(forgotPassword, sendLinkResetPassword, sendMail);

// router.route('/reset_password/:id/:token')
// 	.get(reset_password);

// router.route('/getUser/:id_user')
// 	.get(getUser);

// router.route('/updateDataUser/:id')
// 	.post(validateUpdateDataUser, updateDataUser);

// router.route('/checkSellerAcc/:id')
// 	.get(checkSellerAcc);

// router.route('/activateSeller/')
// 	.post(activateSeller);

// router.route('/addUnit/')
// 	.post(addUnit);

// router.route('/uploadImages/:type/:index/:id_unit')
// 	.post(uploadImages, resizeImages, uploadFoto, removePrevImage);



//test send Email
router.route('/sendEmail/')
	.post(sendMail)

module.exports = router;







