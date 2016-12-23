/** @flow */
import glob from 'glob';
import path from 'path';
import R from 'ramda';
import fs from 'fs-extra';
import { TRANSPILERS_DIR } from '../../constants';
import Command from '../command';

const chalk = require('chalk');

export default class Create extends Command {
  name = 'install <name>';
  description = 'install a transpiler or tester';
  alias = '';
  opts = [];

  action([name, ]: [string], opts: {[string]: boolean}): Promise<*> {
    return new Promise((resolve, reject) => {
      const tranpilersGlobingPattern = path.join(__dirname, '../../..', 'transpilers', '*');
      const pluginsList = glob.sync(tranpilersGlobingPattern);
      const pluginsMap = R.mergeAll(
        pluginsList.map(modulePath => ({ [path.basename(modulePath)]: modulePath }))
      );
      
      if (!pluginsMap[name]) {
        return reject(new Error(`there is no plugin by the name of ${name}`));
      }
      
      const directoryToExtract = path.join(TRANSPILERS_DIR, name);
      fs.ensureDirSync(directoryToExtract);
      return fs.copy(pluginsMap[name], directoryToExtract, (err) => {
        if (err) return reject(err);
        this.installNpm(directoryToExtract)
          .then(() => resolve({ name, directoryToExtract }))
          .catch(error => reject(error));
      });
    });
  }

  report({ name, directoryToExtract }: any): string {
    return chalk.green(`installed "${name}" in ${directoryToExtract}`);
  }

  installNpm(dir) {
    return new Promise((resolve, reject) => {
      const spawn = require('child_process').spawn;
      const cmd = spawn('npm', ['install'], { cwd: dir });
      cmd.stdout.on('data', (data) => {
        console.log(data.toString());
      });
      cmd.stderr.on('data', (data) => {
        console.log(data.toString());
      });
      cmd.on('close', (code) => {
        return code === 0 ? resolve() : reject(`npm install failed with the code: ${code}`);
      });
    });
  }
}
