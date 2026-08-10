const { Client } = require('pg');

const regions = [
  'sa-east-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'ap-southeast-1'
];

async function findPooler() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    console.log(`Testing ${host}:6543 ...`);
    const client = new Client({
      host,
      port: 6543,
      database: 'postgres',
      user: 'postgres.lykwydydrctmjzcvugjd',
      password: 'focusOS19964',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 4000
    });

    try {
      await client.connect();
      console.log(`🎉 SUCCESS! Connected via pooler: ${host}`);
      await client.end();
      return host;
    } catch (e) {
      console.log(`Failed on ${region}: ${e.message}`);
    }
  }
}

findPooler();
