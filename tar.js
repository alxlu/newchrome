const tar = require('tar');
const { join } = require('path');
const pkg = require('./package.json');

return tar.c({
  gzip: true,
  file: `dist/newchrome-${pkg.version}.tar.gz`,
  cwd: join(__dirname, 'dist'),
}, ['newchrome']).then(() => {
  console.log('tarball created');
});
