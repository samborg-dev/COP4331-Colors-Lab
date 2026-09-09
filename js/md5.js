// Minimal MD5 (RFC 1321) implementation.
// Exposes: md5(string) -> lowercase hex digest
function md5(input)
{
	var s = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
	         5, 9,14,20,5, 9,14,20,5, 9,14,20,5, 9,14,20,
	         4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
	         6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];

	var K = new Array(64);
	for( var i = 0; i < 64; i++ )
	{
		K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0;
	}

	function utf8Bytes( str )
	{
		var out = [], i, c, cp;
		for( i = 0; i < str.length; i++ )
		{
			c = str.charCodeAt(i);
			if( c < 0x80 )
			{
				out.push(c);
			}
			else if( c < 0x800 )
			{
				out.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F));
			}
			else if( c < 0xD800 || c >= 0xE000 )
			{
				out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
			}
			else
			{
				i++;
				cp = 0x10000 + (((c & 0x3FF) << 10) | (str.charCodeAt(i) & 0x3FF));
				out.push(0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3F),
				         0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F));
			}
		}
		return out;
	}

	function rotl( x, c )
	{
		return ((x << c) | (x >>> (32 - c))) >>> 0;
	}

	function hexLE( n )
	{
		var out = "", b, j;
		for( j = 0; j < 4; j++ )
		{
			b = (n >>> (j * 8)) & 0xFF;
			out += (b < 16 ? "0" : "") + b.toString(16);
		}
		return out;
	}

	var msg = utf8Bytes(input);
	var bitLen = msg.length * 8;

	msg.push(0x80);
	while( msg.length % 64 !== 56 )
	{
		msg.push(0);
	}
	// 64-bit little-endian length (high word is 0 for our message sizes)
	var lo = bitLen >>> 0;
	var hi = Math.floor(bitLen / 4294967296);
	msg.push(lo & 0xFF, (lo >>> 8) & 0xFF, (lo >>> 16) & 0xFF, (lo >>> 24) & 0xFF);
	msg.push(hi & 0xFF, (hi >>> 8) & 0xFF, (hi >>> 16) & 0xFF, (hi >>> 24) & 0xFF);

	var a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;

	for( var chunk = 0; chunk < msg.length; chunk += 64 )
	{
		var M = new Array(16);
		for( var j = 0; j < 16; j++ )
		{
			M[j] = (msg[chunk + j * 4]) |
			       (msg[chunk + j * 4 + 1] << 8) |
			       (msg[chunk + j * 4 + 2] << 16) |
			       (msg[chunk + j * 4 + 3] << 24);
			M[j] = M[j] >>> 0;
		}

		var A = a0, B = b0, C = c0, D = d0, F, g;

		for( var i2 = 0; i2 < 64; i2++ )
		{
			if( i2 < 16 )
			{
				F = (B & C) | (~B & D);
				g = i2;
			}
			else if( i2 < 32 )
			{
				F = (D & B) | (~D & C);
				g = (5 * i2 + 1) % 16;
			}
			else if( i2 < 48 )
			{
				F = B ^ C ^ D;
				g = (3 * i2 + 5) % 16;
			}
			else
			{
				F = C ^ (B | ~D);
				g = (7 * i2) % 16;
			}

			F = (((F >>> 0) + A + K[i2] + M[g]) % 4294967296) >>> 0;
			A = D;
			D = C;
			C = B;
			B = ((B + rotl(F, s[i2])) % 4294967296) >>> 0;
		}

		a0 = ((a0 + A) % 4294967296) >>> 0;
		b0 = ((b0 + B) % 4294967296) >>> 0;
		c0 = ((c0 + C) % 4294967296) >>> 0;
		d0 = ((d0 + D) % 4294967296) >>> 0;
	}

	return hexLE(a0) + hexLE(b0) + hexLE(c0) + hexLE(d0);
}
