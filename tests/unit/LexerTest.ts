import intern from 'intern';
import Token, { TokenTypeNameMap } from '../../src/parser/Token';
import Lexer from '../../src/parser/Lexer';

const {suite, test} = intern.getPlugin('interface.tdd');
const {assert} = intern.getPlugin('chai');

function encodeString(value: string) {
	return encodeURIComponent(value).replace(new RegExp(/[-_.~'()*]/, 'g'), (value: string) => {
		const encodingMap = {
			'-': '%2D',
			'_': '%5F',
			'.': '%2E',
			'~': '%7E',
			'(': '%28',
			')': '%29',
			'*': '%2A'
		};
		return encodingMap[value];
	});
}

function testTokenization(rql: string, expected: [string, string][], testNumber: number) {
	const lexer = new Lexer();
	const stream = lexer.tokenize(rql);
	assert.equal(stream.length, expected.length + 1, `different stream length, test #${testNumber}`);

	expected.forEach((token: [string, string]) => {
		const [value, type] = token;
		const currentStreamToken = stream.getCurrent();
		assert.equal(value, currentStreamToken.value, `value ${value} !== ${currentStreamToken.value}, test #${testNumber}`);
		assert.equal(type, currentStreamToken.type, `type ${type} !== ${currentStreamToken.type}, test #${testNumber}`);
		stream.next();
	});
}

function testSyntaxError(rql: string, errorMessage: string) {
	try {
		const lexer = new Lexer();
		lexer.tokenize(rql);
	} catch (error) {
		assert.equal(error.message, errorMessage);
	}
}

const dataForTokenizationTest = {
	'primitives': [
		'eq(&eq&limit(limit,)date:empty(),null(),1,+1,-1,0,1.5,-.4e12,2015-04-16T17:40:32Z,*abc?',
		[
			['eq', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['eq', TokenTypeNameMap.T_STRING],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['limit', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['limit', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			['date', TokenTypeNameMap.T_TYPE],
			[':', TokenTypeNameMap.T_COLON],
			['empty()', TokenTypeNameMap.T_EMPTY],
			[',', TokenTypeNameMap.T_COMMA],
			['null()', TokenTypeNameMap.T_NULL],
			[',', TokenTypeNameMap.T_COMMA],
			['1', TokenTypeNameMap.T_INTEGER],
			[',', TokenTypeNameMap.T_COMMA],
			['+1', TokenTypeNameMap.T_INTEGER],
			[',', TokenTypeNameMap.T_COMMA],
			['-1', TokenTypeNameMap.T_INTEGER],
			[',', TokenTypeNameMap.T_COMMA],
			['0', TokenTypeNameMap.T_INTEGER],
			[',', TokenTypeNameMap.T_COMMA],
			['1.5', TokenTypeNameMap.T_FLOAT],
			[',', TokenTypeNameMap.T_COMMA],
			['-.4e12', TokenTypeNameMap.T_FLOAT],
			[',', TokenTypeNameMap.T_COMMA],
			['2015-04-16T17:40:32Z', TokenTypeNameMap.T_DATE],
			[',', TokenTypeNameMap.T_COMMA],
			['*abc?', TokenTypeNameMap.T_GLOB],
		],
	],
	'string encoding': [
		`in(a,(${'+abc'},${encodeString('+abc')},${'-abc'},${encodeString('-abc')},${'null()'},${encodeString('null()')},${'2015-04-19T21:00:00Z'},${encodeString('2015-04-19T21:00:00Z')},${'1.1e+3'},${encodeString('1.1e+3')}))&like(b,${'*abc?'})&eq(c,${encodeString('*abc?')})`,
		[
			['in', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['a', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['+', TokenTypeNameMap.T_PLUS],
			['abc', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['+abc', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['-', TokenTypeNameMap.T_MINUS],
			['abc', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['-abc', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['null()', TokenTypeNameMap.T_NULL],
			[',', TokenTypeNameMap.T_COMMA],
			['null()', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['2015-04-19T21:00:00Z', TokenTypeNameMap.T_DATE],
			[',', TokenTypeNameMap.T_COMMA],
			['2015-04-19T21:00:00Z', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['1.1e+3', TokenTypeNameMap.T_FLOAT],
			[',', TokenTypeNameMap.T_COMMA],
			['1.1e+3', TokenTypeNameMap.T_STRING],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['like', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['b', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['*abc?', TokenTypeNameMap.T_GLOB],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['eq', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['c', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['*abc?', TokenTypeNameMap.T_STRING],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
		],
	],
	'datetime support': [
		'in(a,(2015-04-16T17:40:32Z,2012-02-29T17:40:32Z))',
		[
			['in', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['a', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['2015-04-16T17:40:32Z', TokenTypeNameMap.T_DATE],
			[',', TokenTypeNameMap.T_COMMA],
			['2012-02-29T17:40:32Z', TokenTypeNameMap.T_DATE],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
		],
	],
	'simple eq': [
		'eq(name,value)',
		[
			['eq', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['name', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['value', TokenTypeNameMap.T_STRING],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
		],
	],
	'scalar operators': [
		'eq(a,1)&ne(b,2)&lt(c,3)&gt(d,4)&le(e,5)&ge(f,6)&like(g,*abc?)',
		[
			['eq', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['a', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['1', TokenTypeNameMap.T_INTEGER],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['ne', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['b', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['2', TokenTypeNameMap.T_INTEGER],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['lt', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['c', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['3', TokenTypeNameMap.T_INTEGER],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['gt', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['d', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['4', TokenTypeNameMap.T_INTEGER],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['le', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['e', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['5', TokenTypeNameMap.T_INTEGER],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['ge', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['f', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['6', TokenTypeNameMap.T_INTEGER],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['like', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['g', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['*abc?', TokenTypeNameMap.T_GLOB],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
		],
	],
	'array operators': [
		'in(a,(1,b))&out(c,(2,d))',
		[
			['in', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['a', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['1', TokenTypeNameMap.T_INTEGER],
			[',', TokenTypeNameMap.T_COMMA],
			['b', TokenTypeNameMap.T_STRING],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['out', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['c', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['2', TokenTypeNameMap.T_INTEGER],
			[',', TokenTypeNameMap.T_COMMA],
			['d', TokenTypeNameMap.T_STRING],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
		],
	],
	'multiple query operators': [
		'eq(a,b)&lt(c,d)',
		[
			['eq', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['a', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['b', TokenTypeNameMap.T_STRING],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['lt', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['c', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['d', TokenTypeNameMap.T_STRING],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
		],
	],
	'logic operators': [
		'and(eq(a,b),lt(c,d),or(in(a,(1,f)),gt(g,2)))&not(ne(h,3))',
		[
			['and', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['eq', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['a', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['b', TokenTypeNameMap.T_STRING],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			[',', TokenTypeNameMap.T_COMMA],
			['lt', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['c', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['d', TokenTypeNameMap.T_STRING],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			[',', TokenTypeNameMap.T_COMMA],
			['or', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['in', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['a', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['1', TokenTypeNameMap.T_INTEGER],
			[',', TokenTypeNameMap.T_COMMA],
			['f', TokenTypeNameMap.T_STRING],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			[',', TokenTypeNameMap.T_COMMA],
			['gt', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['g', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['2', TokenTypeNameMap.T_INTEGER],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['not', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['ne', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['h', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['3', TokenTypeNameMap.T_INTEGER],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
		],
	],
	'select, sort and limit operators': [
		'select(a,b,c)&sort(+a,-b)&limit(1)&limit(1,2)',
		[
			['select', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['a', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['b', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['c', TokenTypeNameMap.T_STRING],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['sort', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['+', TokenTypeNameMap.T_PLUS],
			['a', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['-', TokenTypeNameMap.T_MINUS],
			['b', TokenTypeNameMap.T_STRING],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['limit', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['1', TokenTypeNameMap.T_INTEGER],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['limit', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['1', TokenTypeNameMap.T_INTEGER],
			[',', TokenTypeNameMap.T_COMMA],
			['2', TokenTypeNameMap.T_INTEGER],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
		],
	],
	'string typecast': [
		'eq(a,string:3)&' +
		'in(b,(string:true(),string:false(),string:null(),string:empty()))&' +
		'out(c,(string:-1,string:+.5e10))',
		[
			['eq', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['a', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['string', TokenTypeNameMap.T_TYPE],
			[':', TokenTypeNameMap.T_COLON],
			['3', TokenTypeNameMap.T_INTEGER],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['in', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['b', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['string', TokenTypeNameMap.T_TYPE],
			[':', TokenTypeNameMap.T_COLON],
			['true()', TokenTypeNameMap.T_TRUE],
			[',', TokenTypeNameMap.T_COMMA],
			['string', TokenTypeNameMap.T_TYPE],
			[':', TokenTypeNameMap.T_COLON],
			['false()', TokenTypeNameMap.T_FALSE],
			[',', TokenTypeNameMap.T_COMMA],
			['string', TokenTypeNameMap.T_TYPE],
			[':', TokenTypeNameMap.T_COLON],
			['null()', TokenTypeNameMap.T_NULL],
			[',', TokenTypeNameMap.T_COMMA],
			['string', TokenTypeNameMap.T_TYPE],
			[':', TokenTypeNameMap.T_COLON],
			['empty()', TokenTypeNameMap.T_EMPTY],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['out', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['c', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['string', TokenTypeNameMap.T_TYPE],
			[':', TokenTypeNameMap.T_COLON],
			['-1', TokenTypeNameMap.T_INTEGER],
			[',', TokenTypeNameMap.T_COMMA],
			['string', TokenTypeNameMap.T_TYPE],
			[':', TokenTypeNameMap.T_COLON],
			['+.5e10', TokenTypeNameMap.T_FLOAT],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
		],
	],
	'glob typecast': [
		'like(a,glob:3)',
		[
			['like', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['a', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['glob', TokenTypeNameMap.T_TYPE],
			[':', TokenTypeNameMap.T_COLON],
			['3', TokenTypeNameMap.T_INTEGER],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
		],
	],
	'constants': [
		'in(a,(null(),true(),false(),empty()))',
		[
			['in', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['a', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['null()', TokenTypeNameMap.T_NULL],
			[',', TokenTypeNameMap.T_COMMA],
			['true()', TokenTypeNameMap.T_TRUE],
			[',', TokenTypeNameMap.T_COMMA],
			['false()', TokenTypeNameMap.T_FALSE],
			[',', TokenTypeNameMap.T_COMMA],
			['empty()', TokenTypeNameMap.T_EMPTY],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
		],
	],
	'fiql operators': [
		'a=eq=1&b=ne=2&c=lt=3&d=gt=4&e=le=5&f=ge=6&g=in=(7,8)&h=out=(9,10)&i=like=*abc?',
		[
			['a', TokenTypeNameMap.T_STRING],
			['eq', TokenTypeNameMap.T_OPERATOR],
			['1', TokenTypeNameMap.T_INTEGER],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['b', TokenTypeNameMap.T_STRING],
			['ne', TokenTypeNameMap.T_OPERATOR],
			['2', TokenTypeNameMap.T_INTEGER],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['c', TokenTypeNameMap.T_STRING],
			['lt', TokenTypeNameMap.T_OPERATOR],
			['3', TokenTypeNameMap.T_INTEGER],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['d', TokenTypeNameMap.T_STRING],
			['gt', TokenTypeNameMap.T_OPERATOR],
			['4', TokenTypeNameMap.T_INTEGER],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['e', TokenTypeNameMap.T_STRING],
			['le', TokenTypeNameMap.T_OPERATOR],
			['5', TokenTypeNameMap.T_INTEGER],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['f', TokenTypeNameMap.T_STRING],
			['ge', TokenTypeNameMap.T_OPERATOR],
			['6', TokenTypeNameMap.T_INTEGER],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['g', TokenTypeNameMap.T_STRING],
			['in', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['7', TokenTypeNameMap.T_INTEGER],
			[',', TokenTypeNameMap.T_COMMA],
			['8', TokenTypeNameMap.T_INTEGER],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['h', TokenTypeNameMap.T_STRING],
			['out', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['9', TokenTypeNameMap.T_INTEGER],
			[',', TokenTypeNameMap.T_COMMA],
			['10', TokenTypeNameMap.T_INTEGER],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['i', TokenTypeNameMap.T_STRING],
			['like', TokenTypeNameMap.T_OPERATOR],
			['*abc?', TokenTypeNameMap.T_GLOB],
		],
	],
	'fiql operators (json compatible)': [
		'a=1&b==2&c<>3&d!=4&e<5&f>6&g<=7&h>=8',
		[
			['a', TokenTypeNameMap.T_STRING],
			['eq', TokenTypeNameMap.T_OPERATOR],
			['1', TokenTypeNameMap.T_INTEGER],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['b', TokenTypeNameMap.T_STRING],
			['eq', TokenTypeNameMap.T_OPERATOR],
			['2', TokenTypeNameMap.T_INTEGER],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['c', TokenTypeNameMap.T_STRING],
			['ne', TokenTypeNameMap.T_OPERATOR],
			['3', TokenTypeNameMap.T_INTEGER],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['d', TokenTypeNameMap.T_STRING],
			['ne', TokenTypeNameMap.T_OPERATOR],
			['4', TokenTypeNameMap.T_INTEGER],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['e', TokenTypeNameMap.T_STRING],
			['lt', TokenTypeNameMap.T_OPERATOR],
			['5', TokenTypeNameMap.T_INTEGER],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['f', TokenTypeNameMap.T_STRING],
			['gt', TokenTypeNameMap.T_OPERATOR],
			['6', TokenTypeNameMap.T_INTEGER],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['g', TokenTypeNameMap.T_STRING],
			['le', TokenTypeNameMap.T_OPERATOR],
			['7', TokenTypeNameMap.T_INTEGER],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['h', TokenTypeNameMap.T_STRING],
			['ge', TokenTypeNameMap.T_OPERATOR],
			['8', TokenTypeNameMap.T_INTEGER],
		],
	],
	'simple groups': [
		'(eq(a,b)&lt(c,d))&(ne(e,f)|gt(g,h))',
		[
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['eq', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['a', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['b', TokenTypeNameMap.T_STRING],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['lt', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['c', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['d', TokenTypeNameMap.T_STRING],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['ne', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['e', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['f', TokenTypeNameMap.T_STRING],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			['|', TokenTypeNameMap.T_VERTICAL_BAR],
			['gt', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['g', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['h', TokenTypeNameMap.T_STRING],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
		],
	],
	'deep groups & mix groups with operators': [
		'(eq(a,b)|lt(c,d)|and(gt(e,f),(ne(g,h)|gt(i,j)|in(k,(l,m,n))|(o<>p&q=le=r))))',
		[
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['eq', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['a', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['b', TokenTypeNameMap.T_STRING],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			['|', TokenTypeNameMap.T_VERTICAL_BAR],
			['lt', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['c', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['d', TokenTypeNameMap.T_STRING],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			['|', TokenTypeNameMap.T_VERTICAL_BAR],
			['and', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['gt', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['e', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['f', TokenTypeNameMap.T_STRING],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			[',', TokenTypeNameMap.T_COMMA],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['ne', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['g', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['h', TokenTypeNameMap.T_STRING],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			['|', TokenTypeNameMap.T_VERTICAL_BAR],
			['gt', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['i', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['j', TokenTypeNameMap.T_STRING],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			['|', TokenTypeNameMap.T_VERTICAL_BAR],
			['in', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['k', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['l', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['m', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['n', TokenTypeNameMap.T_STRING],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			['|', TokenTypeNameMap.T_VERTICAL_BAR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['o', TokenTypeNameMap.T_STRING],
			['ne', TokenTypeNameMap.T_OPERATOR],
			['p', TokenTypeNameMap.T_STRING],
			['&', TokenTypeNameMap.T_AMPERSAND],
			['q', TokenTypeNameMap.T_STRING],
			['le', TokenTypeNameMap.T_OPERATOR],
			['r', TokenTypeNameMap.T_STRING],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
		],
	],
	'long integers': [
		'in(a,(9223372036854775806,-9223372036854775807,9223372036854775807,-9223372036854775808,9223372036854775808,-9223372036854775809,9223372036854775809,-9223372036854775810))',
		[
			['in', TokenTypeNameMap.T_OPERATOR],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['a', TokenTypeNameMap.T_STRING],
			[',', TokenTypeNameMap.T_COMMA],
			['(', TokenTypeNameMap.T_OPEN_PARENTHESIS],
			['9223372036854775806', TokenTypeNameMap.T_INTEGER],
			[',', TokenTypeNameMap.T_COMMA],
			['-9223372036854775807', TokenTypeNameMap.T_INTEGER],
			[',', TokenTypeNameMap.T_COMMA],
			['9223372036854775807', TokenTypeNameMap.T_INTEGER],
			[',', TokenTypeNameMap.T_COMMA],
			['-9223372036854775808', TokenTypeNameMap.T_INTEGER],
			[',', TokenTypeNameMap.T_COMMA],
			['9223372036854775808', TokenTypeNameMap.T_INTEGER],
			[',', TokenTypeNameMap.T_COMMA],
			['-9223372036854775809', TokenTypeNameMap.T_INTEGER],
			[',', TokenTypeNameMap.T_COMMA],
			['9223372036854775809', TokenTypeNameMap.T_INTEGER],
			[',', TokenTypeNameMap.T_COMMA],
			['-9223372036854775810', TokenTypeNameMap.T_INTEGER],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
			[')', TokenTypeNameMap.T_CLOSE_PARENTHESIS],
		],
	],
};
const dataForSyntaxErrorTest = {
	'unexpected token': [
		'1',
		'Unexpected token "1" (T_INTEGER) at position 0'
	]
};
suite('Lexer Test', () => {
	test('Test tokenization', () => {
			const testQty = Object.keys(dataForTokenizationTest).length;
			Object.values(dataForTokenizationTest).forEach((testData: any[], index) => {
					console.log(`Tokenization test ${index + 1} of ${testQty}`);
					const [rql, result] = testData;
					testTokenization(rql, result, index + 1);
				}
			);
		}
	);
});
