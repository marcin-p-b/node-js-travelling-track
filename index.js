import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "PASSWORD",
  port: 5432,
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

db.connect();

async function checkVisitedCountries() {
  const result = await db.query("SELECT country_code FROM visited_country");
  let countries = [];
  result.rows.forEach((element) => {
    countries.push(element["country_code"]);
  });
  return countries;
}

app.get("/", async (req, res) => {

  const countries = await checkVisitedCountries();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
  });
  console.log(`already visited countries : ${countries}`);
});

app.post("/add", async (req, res) => {
  const inputCountry = req.body["country"];
  const countries = await checkVisitedCountries();
  if (inputCountry.length > 0 && inputCountry[0] !== "-") {
    try {
      const result = await db.query(
        "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
        [inputCountry.toLowerCase()]
      );

      try {
        await db.query(
          "INSERT INTO visited_country (country_code) VALUES($1)",
          [result.rows[0]["country_code"]]
        );
        res.redirect("/");
      } catch (err) {
        res.render("index.ejs", {
          countries: countries,
          total: countries.length,
          error: "Country has already been added, try again.",
        });
        console.log(err);
      }
    } catch (err) {
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        error: "There is no such country on the map, try again.",
      });
      console.log(err);
    }
  } else if (inputCountry.length > 0 && inputCountry[0] === "-") {
    try {
      const result = await db.query(
        "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
        [inputCountry.slice(1).toLowerCase()]
      );

      try {
        await db.query("DELETE FROM visited_country  WHERE country_code = $1", [
          result.rows[0]["country_code"],
        ]);
        res.redirect("/");
      } catch (err) {
        res.render("index.ejs", {
          countries: countries,
          total: countries.length,
          error: "Country has already been added, try again.",
        });
        console.log(err);
      }
    } catch (err) {
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        error: "There is no such country on the map, try again.",
      });
      console.log(err);
    }
  } else {
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      error: "There is no such country on the map, try again.",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
