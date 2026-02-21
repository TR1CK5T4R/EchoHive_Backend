const { Client } = require('pg');

const regions = [
  'ap-south-1', 'us-east-1', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
  'sa-east-1', 'ca-central-1'
];

async function checkRegion(region) {
  const url = `postgresql://postgres.uqwttpyjvagxjqxbohgt:wOprDLeE4paGOR0C@aws-0-${region}.pooler.supabase.com:6543/postgres?sslmode=require`;
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    console.log(`✅ SUCCESS on ${region}`);
    await client.end();
    return true;
  } catch (err) {
    if (err.message.includes('self-signed certificate')) {
        console.log(`✅ SUCCESS on ${region} (cert err)`);
        return true;
    }
    // console.log(`❌ Failed on ${region}: ${err.message}`);
    return false;
  }
}

async function run() {
  console.log('Starting scan...');
  for (const region of regions) {
    const found = await checkRegion(region);
    if (found) process.exit(0);
  }
  console.log('Not found in any region. Tenant might be paused or username is wrong.');
}

run();
