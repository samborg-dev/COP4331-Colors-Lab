const { loadPage, loadCode, clearCookies } = require("./loadCode");

// The README's sample account: password "COP4331" and its MD5 hash
const PASSWORD = "COP4331";
const PASSWORD_MD5 = "5832a71366768098cceb7095efb774f2";

beforeEach(() =>
{
	clearCookies();
});

describe("md5", () =>
{
	test("produces the lowercase hex digest the Users table stores", () =>
	{
		const { md5 } = loadCode();
		expect(md5(PASSWORD)).toBe(PASSWORD_MD5);
		expect(md5("")).toBe("d41d8cd98f00b204e9800998ecf8427e");
	});
});

describe("doLogin", () =>
{
	let app;

	beforeEach(() =>
	{
		loadPage("index.html");
		app = loadCode();
		document.getElementById("loginName").value = "AYadavally";
		document.getElementById("loginPassword").value = PASSWORD;
		app.doLogin();
	});

	test("POSTs the login and MD5-hashed password as JSON to Login.php", () =>
	{
		const xhr = app.lastRequest();
		expect(xhr.method).toBe("POST");
		expect(xhr.url).toBe("http://colors.test/LAMPAPI/Login.php");
		expect(xhr.headers["Content-type"]).toBe("application/json; charset=UTF-8");
		expect(JSON.parse(xhr.body)).toEqual({ login: "AYadavally", password: PASSWORD_MD5 });
		expect(xhr.body).not.toContain(PASSWORD);
	});

	test("on success, stores the user in a cookie and goes to color.html", () =>
	{
		app.lastRequest().respond(200, { id: 7, firstName: "Ada", lastName: "Lovelace", error: "" });

		expect(app.window.location.href).toBe("color.html");
		expect(document.cookie).toBe("firstName=Ada,lastName=Lovelace,userId=7");
		expect(document.getElementById("loginResult").innerHTML).toBe("");
	});

	test("on bad credentials, shows an error and stays on the page", () =>
	{
		app.lastRequest().respond(200, { id: 0, firstName: "", lastName: "", error: "No Records Found" });

		expect(document.getElementById("loginResult").innerHTML).toBe("User/Password combination incorrect");
		expect(app.window.location.href).toBe("http://colors.test/index.html");
		expect(document.cookie).toBe("");
	});
});

describe("readCookie (color.html on load)", () =>
{
	beforeEach(() =>
	{
		loadPage("color.html");
	});

	test("restores the session saved at login and greets the user", () =>
	{
		document.cookie = "firstName=Ada,lastName=Lovelace,userId=7;path=/";
		const app = loadCode();

		app.readCookie();

		expect(document.getElementById("userName").innerHTML).toBe("Logged in as Ada Lovelace");
		expect(app.window.location.href).toBe("http://colors.test/index.html");
	});

	test("sends the user back to the login page when there is no session", () =>
	{
		const app = loadCode();

		app.readCookie();

		expect(app.window.location.href).toBe("index.html");
	});
});

describe("doLogout", () =>
{
	test("clears the session cookie and returns to the login page", () =>
	{
		loadPage("color.html");
		document.cookie = "firstName=Ada,lastName=Lovelace,userId=7;path=/";
		const app = loadCode();

		app.doLogout();

		expect(document.cookie).toBe("");
		expect(app.window.location.href).toBe("index.html");
	});
});

describe("color page", () =>
{
	let app;

	beforeEach(() =>
	{
		loadPage("color.html");
		document.cookie = "firstName=Ada,lastName=Lovelace,userId=7;path=/";
		app = loadCode();
		app.readCookie();
	});

	describe("addColor", () =>
	{
		test("POSTs the new color with the logged-in user's id", () =>
		{
			document.getElementById("colorText").value = "Teal";

			app.addColor();

			const xhr = app.lastRequest();
			expect(xhr.method).toBe("POST");
			expect(xhr.url).toBe("http://colors.test/LAMPAPI/AddColor.php");
			expect(JSON.parse(xhr.body)).toEqual({ color: "Teal", userId: 7 });
		});

		test("confirms once the server responds", () =>
		{
			document.getElementById("colorText").value = "Teal";
			app.addColor();
			expect(document.getElementById("colorAddResult").innerHTML).toBe("");

			app.lastRequest().respond(200, { error: "" });

			expect(document.getElementById("colorAddResult").innerHTML).toBe("Color has been added");
		});
	});

	describe("searchColor", () =>
	{
		test("POSTs the search text with the logged-in user's id", () =>
		{
			document.getElementById("searchText").value = "ge";

			app.searchColor();

			const xhr = app.lastRequest();
			expect(xhr.url).toBe("http://colors.test/LAMPAPI/SearchColors.php");
			expect(JSON.parse(xhr.body)).toEqual({ search: "ge", userId: 7 });
		});

		test("lists each result on its own line", () =>
		{
			app.searchColor();
			app.lastRequest().respond(200, { results: ["Blue", "Magenta", "Beige"], error: "" });

			const list = document.getElementById("colorList");
			expect(list.querySelectorAll("br")).toHaveLength(2);
			expect(list.textContent.split(/\s*\n\s*/)).toEqual(["Blue", "Magenta", "Beige"]);
			expect(document.getElementById("colorSearchResult").innerHTML).toBe("Color(s) has/have been retrieved");
		});

		test("shows an empty list when nothing matches", () =>
		{
			document.getElementById("colorList").innerHTML = "stale results";

			app.searchColor();
			app.lastRequest().respond(200, { results: [], error: "No Records Found" });

			expect(document.getElementById("colorList").innerHTML).toBe("");
		});
	});
});
