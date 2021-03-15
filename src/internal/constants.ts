/**
 * Common Error Codes
 */
export const STATUS_CODES: Record<string|number, string> = {
	'400': 'Bad Request',
	'401': 'Unauthorized',
	'403': 'Forbidden',
	'404': 'Not Found',
	'405': 'Method Not Allowed',
	'406': 'Not Acceptable',
	'409': 'Conflict',
	'410': 'Gone',
	'411': 'Length Required',
	'413': 'Payload Too Large',
	'422': 'Unprocessable Entity',
	'428': 'Precondition Required',
	'429': 'Too Many Requests',
	'500': 'Internal Server Error',
	'501': 'Not Implemented',
	'502': 'Bad Gateway',
	'503': 'Service Unavailable',
	'504': 'Gateway Timeout',
};
