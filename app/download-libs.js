// app/download-libs.js
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const libDir = path.join(__dirname, 'lib');
const runtimesDir = path.join(__dirname, 'runtimes', 'win-x64', 'native');
fs.mkdirSync(libDir, { recursive: true });
fs.mkdirSync(runtimesDir, { recursive: true });

const nugetUrl = 'https://www.nuget.org/api/v2/package/Microsoft.Web.WebView2/1.0.2903.40';
const zipPath = path.join(__dirname, 'webview2.zip');

console.log('Mengunduh Microsoft WebView2 SDK dari NuGet...');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const get = (u) => {
      https.get(u, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          get(response.headers.location);
          return;
        }
        if (response.statusCode !== 200) {
          reject(new Error(`Download failed with status code ${response.statusCode}`));
          return;
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      }).on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    };
    get(url);
  });
}

async function run() {
  try {
    await download(nugetUrl, zipPath);
    console.log('Ekstraksi WebView2 DLLs...');
    
    // Extract using powershell Expand-Archive
    const extractDir = path.join(__dirname, 'webview2_extracted');
    fs.mkdirSync(extractDir, { recursive: true });
    
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractDir}' -Force"`);

    // Copy DLLs
    const net45Dir = path.join(extractDir, 'lib', 'net45');
    if (fs.existsSync(net45Dir)) {
      fs.copyFileSync(path.join(net45Dir, 'Microsoft.Web.WebView2.Core.dll'), path.join(libDir, 'Microsoft.Web.WebView2.Core.dll'));
      fs.copyFileSync(path.join(net45Dir, 'Microsoft.Web.WebView2.WinForms.dll'), path.join(libDir, 'Microsoft.Web.WebView2.WinForms.dll'));
    }

    const nativeDir = path.join(extractDir, 'runtimes', 'win-x64', 'native');
    if (fs.existsSync(nativeDir)) {
      fs.copyFileSync(path.join(nativeDir, 'WebView2Loader.dll'), path.join(runtimesDir, 'WebView2Loader.dll'));
      fs.copyFileSync(path.join(nativeDir, 'WebView2Loader.dll'), path.join(__dirname, 'WebView2Loader.dll'));
    }

    // Cleanup
    fs.rmSync(zipPath, { force: true });
    fs.rmSync(extractDir, { recursive: true, force: true });

    console.log('✓ WebView2 SDK berhasil disiapkan di folder app/lib/');
  } catch (err) {
    console.error('Gagal menyiapkan WebView2 SDK:', err);
    process.exit(1);
  }
}

run();
