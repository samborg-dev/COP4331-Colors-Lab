const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const md5Source = read("js/md5.js");
const codeSource = read("js/code.js");

// Replaces the current jsdom document with the markup of one of the app's pages,
// so tests run against the same element ids the real HTML uses.
function loadPage(htmlFile)
{
	document.documentElement.innerHTML = read(htmlFile);
}

// Minimal XMLHttpRequest stand-in. Records what code.js sends and lets a test
// play back a server response with respond().
class FakeXHR
{
	constructor()
	{
		this.headers = {};
		this.readyState = 0;
		FakeXHR.requests.push(this);
	}

	open(method, url, async)
	{
		this.method = method;
		this.url = url;
		this.async = async;
		this.readyState = 1;
	}

	setRequestHeader(name, value)
	{
		this.headers[name] = value;
	}

	send(body)
	{
		this.body = body;
	}

	respond(status, json)
	{
		this.readyState = 4;
		this.status = status;
		this.responseText = JSON.stringify(json);
		this.onreadystatechange.call(this);
	}
}
FakeXHR.requests = [];

// js/code.js is a classic browser script: top-level functions and `let` globals,
// no exports. Wrapping it in a function gives each test a fresh copy of that
// state, and lets us hand it a fake `window` (so redirects can be observed
// instead of triggering navigation) and a fake XMLHttpRequest (so no network).
// `document` is jsdom's real one, so DOM and cookie handling are exercised as-is.
function loadCode()
{
	const md5 = new Function(md5Source + "\nreturn md5;")();

	const window = {
		location: { protocol: "http:", host: "colors.test", href: "http://colors.test/index.html" }
	};
	FakeXHR.requests = [];

	const app = new Function("window", "XMLHttpRequest", "md5",
		codeSource + "\nreturn { doLogin, saveCookie, readCookie, doLogout, addColor, searchColor };"
	)(window, FakeXHR, md5);

	return {
		...app,
		md5,
		window,
		lastRequest: () => FakeXHR.requests[FakeXHR.requests.length - 1]
	};
}

function clearCookies()
{
	for (const cookie of document.cookie.split(";"))
	{
		const name = cookie.split("=")[0].trim();
		if (name)
		{
			document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
		}
	}
}

module.exports = { loadPage, loadCode, clearCookies };
