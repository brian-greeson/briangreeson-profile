console.log(`Running in: ${process.env.NODE_ENV}`);
console.log(`DBNAME: ${process.env.DB_FILE_NAME}`)
if (process.env.NODE_ENV != "production") {
  process.loadEnvFile();
}
