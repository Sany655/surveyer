/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals.push({
      'pg-hstore': 'commonjs pg-hstore',
      'pg': 'commonjs pg',
      'sqlite3': 'commonjs sqlite3',
      'tedious': 'commonjs tedious',
      'oracledb': 'commonjs oracledb',
      'mysql2': 'commonjs mysql2' // We use mysql2, but Sequelize sometimes tries to require it dynamically
    });
    return config;
  },
  serverExternalPackages: ['sequelize', 'mysql2'],
  turbopack: {},
};

export default nextConfig;
