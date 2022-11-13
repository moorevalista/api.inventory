const responseData = function (response, statusCode, responseCode, values) {
	var data = {
		status: statusCode,
		responseCode: responseCode,
		data: values,
	};
	response.status(statusCode).json(data);
	response.end();
};

const responseMessage = function (response, statusCode, responseCode, message) {
	var data = {
		status: statusCode,
		responseCode: responseCode,
		message: message,
	};
	response.status(statusCode).json(data);
	response.end();
};

const responseDataWithToken = function (response, statusCode, responseCode, message, token, values) {
	var data = {
		status: statusCode,
		responseCode: responseCode,
		message: message,
		token: token,
		data: values,
	};
	response.status(statusCode).json(data);
	response.end();
};

module.exports = { responseData, responseMessage, responseDataWithToken };