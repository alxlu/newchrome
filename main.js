#!/usr/bin/env node

const yargs = require('yargs');
const { execSync } = require('child_process');
const os = require('os');
const { join } = require('path');
const fs = require('fs-extra');

const time = new Date().getTime();
const homeDir = process.env.HOME;
const tmpDir = os.tmpdir();
const templateDir = join(homeDir, '.newchrome', 'templates');
const profileDir = join(homeDir, '.newchrome', 'profiles');
const configFile = join(homeDir, '.newchrome', 'config.js');

try {
  fs.ensureDirSync(templateDir);
  fs.ensureDirSync(profileDir);
} catch (err) {
  console.log(templateDir);
  console.log(profileDir);
  console.log('Error creating required directories');
  throw new Error(err);
}

const runChrome = (dir, url, flags) => {
  if (flags) {
    const cmd = `exec open -na "Google Chrome" --args "--user-data-dir=${dir}" "${flags}" "${url}"`;
    console.log(cmd);
    execSync(cmd);
  } else {
    const cmd = `exec open -na "Google Chrome" --args "--user-data-dir=${dir}" "${url}"`;
    console.log(cmd);
    execSync(cmd);
  }
};

const launch = argv => {
  const origDir = join(templateDir, argv.name);
  const instanceDir = join(profileDir, argv.name);
  try {
    fs.copySync(origDir, instanceDir, { overwrite: false, errorOnExist: true });
  } catch (err) {
    console.log('launching existing instance');
  }
  runChrome(instanceDir, argv.url, argv.flags);
};

const instance = argv => {
  const origDir = join(profileDir, argv.name);
  const tmpDir = join(tmpDir, `${argv.name}${time}`);
  try {
    fs.copySync(origDir, tmpDir);
  } catch (err) {
    console.log('Error writing to temp directory');
    throw new Error(err);
  }
  runChrome(tmpDir, argv.url, argv.flags);
};

const auto = argv => {
  const config = fs.existsSync(configFile) && require(configFile);
  const profile = typeof config === 'function' ? config(argv.url) : null;
  if (typeof profile === 'string') {
    const dir = join(profileDir, profile);
    runChrome(dir, argv.url, argv.flags);
  } else {
    execSync(`exec open -na "Google Chrome" --args "${argv.url}"`);
  }
};

const edit = argv => {
  const dir = join(templateDir, argv.name);
  fs.ensureDirSync(dir);
  execSync(`exec open -na "Google Chrome" --args "--user-data-dir=${dir}"`);
};

const launchDefault = (argv) => {
  execSync(`exec open -na "Google Chrome" --args "${argv.url}"`);
}

const save = argv => {
  const origDir = join(templateDir, argv.name);
  const instanceDir = join(profileDir, argv.name);
  fs.copySync(instanceDir, origDir);
};

const remove = argv => {
  const origDir = join(templateDir, argv.name);
  const instanceDir = join(profileDir, argv.name);
  fs.removeSync(origDir);
  fs.removeSync(instanceDir);
};

const list = argv => {
  const profiles = fs.readdirSync(templateDir);
  profiles.filter(profile => {
    if (argv.filter) {
      return profile.startsWith(argv.filter);
    }
    return profile
  }).forEach(profile => console.log(profile));
};

const reset = argv => {
  const instanceDir = join(profileDir, argv.name);
  fs.removeSync(instanceDir);
};

return yargs
  .usage('$0 <url> [args]')
  .command(
    ['* [url]', 'launch [url]'],
    'launch a specific chrome profile',
    yargs => {
      yargs
        .positional('url', {
          type: 'string',
          default: 'about:blank',
          describe: 'the url to navigate to',
        })
        .option('name', {
          alias: 'n',
          default: 'default',
        })
        .option('flags', {
          alias: 'f',
        })
        .option('default', {
          alias: 'd',
        });
    },
    launch,
  )
  .command(
    ['auto [url]'],
    'launch profile based on url rules in config file',
    yargs => {
      yargs
        .positional('url', {
          type: 'string',
          default: 'about:blank',
          describe: 'the url to navigate to',
        })
        .option('flags', {
          alias: 'f',
        });
    },
    auto,
  )
  .command(
    ['i [url]', 'instance [url]'],
    'launch a copy of a chrome profile',
    yargs => {
      yargs
        .positional('url', {
          type: 'string',
          default: 'about:blank',
          describe: 'the url to navigate to',
        })
        .option('name', {
          alias: 'n',
          default: 'default',
        })
        .option('flags', {
          alias: 'f',
        });
    },
    instance,
  )
  .command(
    ['edit [name]'],
    'edit or create a chrome instance',
    yargs => {
      yargs.positional('name', {
        type: 'string',
        default: 'default',
        describe: 'the name of the profile to edit',
      });
    },
    edit,
  )
  .command(['reset [name]'], 'reset a chrome instance', yargs => {
    yargs.positional('name', {
      type: 'string',
      describe: 'the name of the profile to reset',
      default: 'default',
    }).option('all', {
      alias: 'a',
    });
  }, reset)
  .command(['remove [name]', 'rm [name]'], 'delete a chrome instance', yargs => {
    yargs.positional('name', {
      type: 'string',
      describe: 'the name of the profile to delete',
    });
  }, remove)
  .command(
    ['save [name]', 'persist [name]'],
    'save a profile back to the template',
    yargs => {
      yargs.positional('name', {
        type: 'string',
        describe: 'the name of the profile to delete',
      });
    },
    save,
  )
  .command(['ls [filter]', 'list [filter]'], 'list chrome instances', yargs => {
    yargs.positional('filter', {
      type: 'string',
      describe: 'filter for profile names',
    });
  }, list)
  .command(['default [url]'], 'launch default profile', yargs => {
    yargs.positional('url', {
      type: 'string',
      default: 'about:blank',
      describe: 'the url to open',
    });
  }, launchDefault)
  .help().argv;
