#!/usr/bin/env node

/**
 * Seed Admin Profiles Script
 * Automatically seeds admin profiles into Supabase
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};

envContent.split('\n').forEach(line => {
  line = line.trim();
  // Skip empty lines and comments
  if (!line || line.startsWith('#')) return;
  
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

console.log('📋 Loaded environment variables:', Object.keys(env));

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  console.error('Found:', { SUPABASE_URL, SUPABASE_KEY });
  process.exit(1);
}

console.log(`✅ Supabase URL: ${SUPABASE_URL}`);
console.log(`✅ Supabase Key: ${SUPABASE_KEY.substring(0, 20)}...\n`);

const ADMIN_USERS = [
  {
    id: '4e8517b8-4ec0-4c15-8b9e-aee72fbc5c12',
    full_name: 'Admin User 1',
  },
  {
    id: 'f5501a6c-7233-4a02-a5e4-a7539ad0dcea',
    full_name: 'Admin User 2',
  },
];

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL);
    const options = {
      hostname: url.hostname,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function seedProfiles() {
  console.log('🌱 Seeding Admin Profiles...\n');

  for (const admin of ADMIN_USERS) {
    try {
      const response = await makeRequest(
        'POST',
        '/rest/v1/profiles',
        {
          id: admin.id,
          full_name: admin.full_name,
          role: 'SUPER_ADMIN',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      );

      if (response.status === 201) {
        console.log(`✅ Seeded: ${admin.full_name} (${admin.id})`);
      } else if (response.status === 409) {
        console.log(`⚠️  Already exists: ${admin.full_name}`);
      } else {
        console.log(`❌ Failed to seed ${admin.full_name}: ${response.status}`);
        console.log(JSON.stringify(response.data, null, 2));
      }
    } catch (error) {
      console.error(`❌ Error seeding ${admin.full_name}:`, error.message);
    }
  }

  console.log('\n✅ Seeding complete!');
}

seedProfiles().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
