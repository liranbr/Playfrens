import dotenvSafe from "dotenv-safe";
import dotenv from "dotenv";

dotenvSafe.config({ debug: true, path: ".env" });
dotenv.config({ debug: true, path: ".env.public" });

