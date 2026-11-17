// Sends real HTTP requests to the PHP endpoints in LAMPAPI/, which talk to a real
// MySQL database loaded from seed.sql. CI starts both before running this file;
// see .github/workflows/ci.yml.
const API_URL = process.env.API_URL || "http://127.0.0.1:8000/LAMPAPI";

const USER_1 = 1; // AYadavally: Blue, Magenta, Beige
const USER_2 = 2; // GHopper: Crimson

async function post(endpoint, body)
{
	const response = await fetch(API_URL + "/" + endpoint, {
		method: "POST",
		headers: { "Content-Type": "application/json; charset=UTF-8" },
		body: JSON.stringify(body)
	});
	const text = await response.text();

	let json;
	try
	{
		json = JSON.parse(text);
	}
	catch
	{
		// Usually a PHP error page; show it so the CI log says what went wrong
		throw new Error(endpoint + " did not return valid JSON (HTTP " + response.status + "):\n" + text);
	}

	return { status: response.status, contentType: response.headers.get("content-type"), json };
}

describe("Login.php", () =>
{
	test("returns the user's id and name for valid credentials", async () =>
	{
		const res = await post("Login.php", { login: "AYadavally", password: "5832a71366768098cceb7095efb774f2" });

		expect(res.status).toBe(200);
		expect(res.contentType).toMatch(/^application\/json/);
		expect(res.json).toEqual({ id: USER_1, firstName: "Aashish", lastName: "Yadavally", error: "" });
	});

	test("returns id 0 and an error for a wrong password", async () =>
	{
		const res = await post("Login.php", { login: "AYadavally", password: "5ebe2294ecd0e0f08eab7690d2a6ee69" });

		expect(res.status).toBe(200);
		expect(res.json).toEqual({ id: 0, firstName: "", lastName: "", error: "No Records Found" });
	});

	test("returns id 0 and an error for an unknown login", async () =>
	{
		const res = await post("Login.php", { login: "nobody", password: "5832a71366768098cceb7095efb774f2" });

		expect(res.json).toEqual({ id: 0, firstName: "", lastName: "", error: "No Records Found" });
	});
});

describe("SearchColors.php", () =>
{
	test("returns the user's colors containing the search text", async () =>
	{
		const res = await post("SearchColors.php", { search: "ge", userId: USER_1 });

		expect(res.status).toBe(200);
		expect(res.contentType).toMatch(/^application\/json/);
		expect(Object.keys(res.json).sort()).toEqual(["error", "results"]);
		expect(res.json.error).toBe("");
		expect(res.json.results.sort()).toEqual(["Beige", "Magenta"]);
	});

	test("matches case-insensitively", async () =>
	{
		const res = await post("SearchColors.php", { search: "BLUE", userId: USER_1 });

		expect(res.json.results).toEqual(["Blue"]);
	});

	test("returns an empty list and an error when nothing matches", async () =>
	{
		const res = await post("SearchColors.php", { search: "zzz", userId: USER_1 });

		expect(res.json).toEqual({ results: [], error: "No Records Found" });
	});

	test("never returns another user's colors", async () =>
	{
		const own = await post("SearchColors.php", { search: "", userId: USER_2 });
		const other = await post("SearchColors.php", { search: "Crimson", userId: USER_1 });

		expect(own.json.results).toEqual(["Crimson"]);
		expect(other.json).toEqual({ results: [], error: "No Records Found" });
	});
});

describe("AddColor.php", () =>
{
	test("adds a color that the same user can then find", async () =>
	{
		// Unique name so the test also passes against a database it has run on before
		const color = "Teal" + Date.now();

		const add = await post("AddColor.php", { color: color, userId: USER_1 });
		expect(add.status).toBe(200);
		expect(add.contentType).toMatch(/^application\/json/);
		expect(add.json).toEqual({ error: "" });

		const found = await post("SearchColors.php", { search: color, userId: USER_1 });
		expect(found.json).toEqual({ results: [color], error: "" });

		const hidden = await post("SearchColors.php", { search: color, userId: USER_2 });
		expect(hidden.json.results).toEqual([]);
	});
});
