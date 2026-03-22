import path from "path";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.ALLOW_ADMIN_REGISTRATION = "true";
process.env.MONGOMS_DOWNLOAD_DIR = path.join(process.cwd(), "server", ".cache", "mongodb-binaries");
