const validate = require('validate.js');
var moment = require('moment');

validate.extend(validate.validators.datetime, {
  // The value is guaranteed not to be null or undefined but otherwise it
  // could be anything.
  parse: function(value, options) {
    return +moment.utc(value);
  },
  // Input is a unix timestamp
  format: function(value, options) {
    var format = options.dateOnly ? "YYYY-MM-DD" : "YYYY-MM-DD hh:mm:ss";
    return moment.utc(value).format(format);
  }
});

exports.validateUser = (data) => {
	var name_pattern = /^[^\s]+[a-zA-Z .]+$/;
	var gelar_pattern = /^[^\s]+[a-zA-Z .,_-]+$/;
	// var name_pattern = /^[a-zA-Z .]+$/;
	// var gelar_pattern = /^[a-zA-Z .,_-]+$/;
	var pass_pattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,15}/;
	var hp_pattern = /^(0|08|08[0-9]{1,14})$/

	var constraint = {
		nama: {
			format: {
				pattern: name_pattern,
				message: 'tidak valid'
			},
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong'
			},
			length: {
				minimum: 3,
				maximum: 30,
				tooShort: 'minimal 3 digit',
				tooLong: 'maksimal 30 digit'
			}
		},
		kategori: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong'
			},
		},
		nama_toko: {
			format: {
				pattern: name_pattern,
				message: 'tidak valid'
			},
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong'
			},
			length: {
				minimum: 3,
				maximum: 30,
				tooShort: 'minimal 3 digit',
				tooLong: 'maksimal 30 digit'
			}
		},
		nomor_handphone: {
			format: {
				pattern: hp_pattern,
				message: 'tidak valid'
			},
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong'
			},
			length: {
				minimum: 10,
				maximum: 15,
				tooShort: 'minimal 10 digit',
				tooLong: 'maksimal 15 digit'
			}
		},
		email: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong'
			},
			length: {
				maximum: 50,
				tooLong: 'maksimal 50 digit'
			},
			email: {
				email: true,
				message: 'tidak valid'
			}
		},
		kata_sandi: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong'
			},
			length: {
				minimum: 8,
				maximum: 15,
				tooShort: 'minimal 8 digit',
				tooLong: 'maksimal 15 digit'
			},
			format: {
				pattern: pass_pattern,
				message: 'harus mengandung huruf besar, kecil dan angka'
			}
		}
	};

	return validate(data, constraint, { format: 'flat' });
};

exports.validateHp = (data) => {
	var constraint = {
		nomor_handphone: {
			presence: {
				allowEmpty: false,
				message: 'tidak ditemukan'
			},
			// length: {
			// 	minimum: 10,
			// 	maximum: 15,
			// 	tooShort: 'minimal 10 digit',
			// 	tooLong: 'maksimal 15 digit'
			// }
		},
	};

	return validate(data, constraint, { format: 'flat' });
}

exports.validateEmail = (data) => {
	var constraint = {
		email: {
			presence: {
				allowEmpty: false,
				message: 'tidak ditemukan'
			},
			email: {
				email: true,
				message: 'tidak valid'
			}
		}
	};

	return validate(data, constraint, { format: 'flat' });
}

exports.validateAddProductCategory = (data) => {
	var constraint = {
		id_outlet: {
			presence: {
				allowEmpty: false,
				message: 'tidak ditemukan'
			},
		},
		product_category: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong'
			},
		}
	};

	return validate(data, constraint, { format: 'flat' });
}

exports.validateEditProductCategory = (data) => {
	var constraint = {
		id_outlet: {
			presence: {
				allowEmpty: false,
				message: 'tidak ditemukan'
			},
		},
		id_product_category: {
			presence: {
				allowEmpty: false,
				message: 'tidak ditemukan'
			},
		},
		product_category: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong'
			},
		}
	};

	return validate(data, constraint, { format: 'flat' });
}

exports.validateUpdateOutlet = (data) => {
	var constraint = {
		id_category: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong'
			},
		}
	};

	return validate(data, constraint, { format: 'flat' });
}

exports.validateAddProduct = (data) => {
	var constraint = {
		nama_barang: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong'
			},
		},
		kategori: {
			presence: {
				allowEmpty: false,
				message: 'tidak ditemukan'
			},
		},
		harga: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong'
			},
		},
		satuan_barang: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong'
			},
		},
		stok: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong'
			},
		},
	};

	// return validate.isNumber(data);
	const callback = validate(data, constraint, { format: 'flat' });

	if(callback === undefined) {
		const val = parseFloat(data.harga);
		const result = validate.isNumber(val);
		const val1 = parseFloat(data.stok);
		const result1 = validate.isNumber(val1);
		
		if(!result) {
			return(['Harga tidak valid']);
		}else if(!result1) {
			return(['Stok tidak valid']);
		}
	}else {
		return callback;
	}

	// return validate(data, constraint, { format: 'flat' });
}

exports.validateEditProduct = (data) => {
	var constraint = {
		stok: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong'
			},
		}
	};

	return validate(data, constraint, { format: 'flat' });
}

exports.validateEditProductName = (data) => {
	var constraint = {
		nama_barang: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong'
			},
		}
	};

	return validate(data, constraint, { format: 'flat' });
}












exports.validateUpdateUser = (data) => {
	var constraint = {
		email: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong'
			},
			length: {
				maximum: 50,
				tooLong: 'maksimal 50 digit'
			},
			email: {
				email: true,
				message: 'tidak valid'
			}
		},
		alamat: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong'
			}
		},
		kelurahan: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong'
			}
		},
		latitude: {
			presence: {
				allowEmpty: false,
				message: 'tidak terdeteksi, pastikan GPS anda aktif'
			}
		},
		longitude: {
			presence: {
				allowEmpty: false,
				message: 'tidak terdeteksi, pastikan GPS anda aktif'
			}
		},
	};

	return validate(data, constraint, { format: 'flat' });
};

exports.validateSeller = (data) => {
	// var name_pattern = /^[a-zA-Z .]+$/;
	// var name_pattern = /^[a-zA-Z .,_-]+$/;
	var name_pattern = /^[^\s]+[a-zA-Z .,_-]+$/;

	var constraint = {
		nama_usaha: {
			format: {
				pattern: name_pattern,
				message: 'tidak valid'
			},
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong'
			},
			length: {
				minimum: 3,
				maximum: 50,
				tooShort: 'minimal 3 digit',
				tooLong: 'maksimal 50 digit'
			}
		},
		kategori_usaha: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong'
			},
		},
		jenis_usaha: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong'
			},
		},
	};

	return validate(data, constraint, { format: 'flat' });
};

exports.validateCarsUnit = (data) => {
	var constraint = {
		seller: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong',
			}
		},
		unit: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong',
			}
		},
		merk: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong',
			}
		},
		model: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong',
			}
		},
		variant: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong',
			}
		},
		tahun_produksi: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong',
			}
		},
		jenis_transmisi: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong',
			}
		},
		jenis_bahan_bakar: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong',
			}
		},
		kapasitas_mesin: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong',
			}
		},
		tipe_nomor_plat: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong',
			}
		},
		masa_berlaku_pajak: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong',
			},
			date: {
				date: true,
				message: 'tidak valid'
			}
		},
		jarak_tempuh: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong',
			}
		},
		tipe_registrasi: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong',
			}
		},
		warna_kendaraan: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong',
			}
		},
		kondisi_ac: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong',
			}
		},
		usia_ban: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong',
			}
		},
		kebocoran_oli: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong',
			}
		},
		kondisi_cat: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong',
			}
		},
		kondisi_mesin: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong',
			}
		},
		nilai_jual: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong',
			}
		}
	};

	// return validate.isNumber(data);
	const callback = validate(data, constraint, { format: 'flat' });

	if(callback === undefined) {
		const val = parseFloat(data.nilai_jual);
		const result = validate.isNumber(val);
		
		if(!result) {
			return(['Nilai jual tidak valid']);
		}
	}else {
		return callback;
	}
}




















exports.validatePassword = (data) => {
	var pass_pattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,15}/;

	var constraint = {
		kata_sandi: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong'
			},
			length: {
				minimum: 8,
				maximum: 15,
				tooShort: 'minimal 8 digit',
				tooLong: 'maksimal 15 digit'
			},
			format: {
				pattern: pass_pattern,
				message: 'harus mengandung huruf besar, kecil dan angka'
			}
		}
	};

	return validate(data, constraint, { format: 'flat' });
}

exports.validateAccountNumber = (data) => {
	var constraint = {
		kode_bank: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong'
			}
		},
		nomor_rekening: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong'
			}
		}
	};

	return validate(data, constraint, { format: 'flat' });
}

exports.validateDataPengalaman = (data) => {
	var constraint = {
		sertifikasi: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong'
			}
		},
		faskes: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong'
			}
		}
	};

	return validate(data, constraint, { format: 'flat' });
}

exports.validateLayananNakes = (data) => {
	var constraint = {
		biaya_layanan: {
			presence: {
				allowEmpty: false,
				message: 'tidak boleh kosong'
			}
		}
	};

	// return validate.isNumber(data);
	const callback = validate(data, constraint, { format: 'flat' });

	if(callback === undefined) {
		const val = parseFloat(data.biaya_layanan);
		const result = validate.isNumber(val);
		
		if(!result) {
			return(['Biaya layanan tidak valid']);
		}
	}else {
		return callback;
	}
}














