import dotenv from "dotenv";
dotenv.config();

export const env = {
  appEnv: process.env.APP_ENV || "development",
  appPort: Number(process.env.APP_PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || "change_this_secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
  dbHost: process.env.DB_HOST || "localhost",
  dbPort: Number(process.env.DB_PORT || 5432),
  dbName: process.env.DB_NAME || "soc_management",
  dbUser: process.env.DB_USER || "postgres",
  dbPassword: process.env.DB_PASSWORD || "postgres",
  ldapUrl: process.env.LDAP_URL || "",
  ldapBindDN: process.env.LDAP_BIND_DN || "",
  ldapBindPassword: process.env.LDAP_BIND_PASSWORD || "",
  ldapSearchBase: process.env.LDAP_SEARCH_BASE || "",
  ldapSearchFilter: process.env.LDAP_SEARCH_FILTER || "(mail={username})",
  ldapTls: process.env.LDAP_TLS === "true",
};