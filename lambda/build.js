const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Lambda function entry points
const entryPoints = {
  'story-generation': './src/story-generation.ts',
  'story-fill': './src/story-fill.ts',
  'image-generation': './src/image-generation.ts',
  'test-aws': './src/test-aws.ts',
};

// Build configuration
const buildConfig = {
  entryPoints,
  bundle: true,
  minify: true,
  sourcemap: true,
  target: 'node18',
  platform: 'node',
  outdir: 'dist',
  format: 'cjs',
  external: [
    '@aws-sdk/*', // AWS SDK is provided by Lambda runtime
  ],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  banner: {
    js: '// Lambda function built with esbuild',
  },
};

async function build() {
  try {
    console.log('🔨 Building Lambda functions...');
    
    const result = await esbuild.build(buildConfig);
    
    if (result.errors.length > 0) {
      console.error('❌ Build errors:', result.errors);
      process.exit(1);
    }
    
    if (result.warnings.length > 0) {
      console.warn('⚠️ Build warnings:', result.warnings);
    }
    
    console.log('✅ Lambda functions built successfully!');
    
    // List built files
    const files = fs.readdirSync(distDir);
    console.log('📦 Built files:');
    files.forEach(file => {
      const filePath = path.join(distDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`  - ${file} (${sizeKB} KB)`);
    });
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Run build if this script is executed directly
if (require.main === module) {
  build();
}

module.exports = { build, buildConfig };