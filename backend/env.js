import dotenvSafe from "dotenv-safe";
import dotenv from "dotenv";

// delete later "allowemptyvalues", this sucks actually on god.
dotenvSafe.config({ debug: true, path: ".env", allowEmptyValues: true });
dotenv.config({ debug: true, path: ".env.public" });

