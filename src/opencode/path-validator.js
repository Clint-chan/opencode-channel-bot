import { resolve, normalize } from 'path';
import { access, stat } from 'fs/promises';
import { constants } from 'fs';

export class PathValidator {
  static normalize(inputPath) {
    if (!inputPath || typeof inputPath !== 'string') {
      throw new Error('Path must be a non-empty string');
    }

    let normalizedPath = inputPath.trim();

    if (normalizedPath.startsWith('~')) {
      const homeDir = process.env.HOME || process.env.USERPROFILE;
      if (!homeDir) {
        throw new Error('Cannot resolve home directory');
      }
      normalizedPath = normalizedPath.replace(/^~/, homeDir);
    }

    normalizedPath = normalizedPath.replace(/\\/g, '/');

    if (process.platform === 'win32') {
      if (/^\/mnt\/([a-z])\//i.test(normalizedPath)) {
        const drive = normalizedPath.match(/^\/mnt\/([a-z])\//i)[1].toUpperCase();
        normalizedPath = normalizedPath.replace(/^\/mnt\/[a-z]\//i, `${drive}:/`);
      }
    } else {
      if (/^[a-z]:\//i.test(normalizedPath)) {
        const drive = normalizedPath.match(/^([a-z]):\//i)[1].toLowerCase();
        normalizedPath = normalizedPath.replace(/^[a-z]:\//i, `/mnt/${drive}/`);
      }
    }

    const isWindowsAbsolute = /^[a-z]:\//i.test(normalizedPath);
    const isPosixAbsolute = normalizedPath.startsWith('/');
    
    if (!isWindowsAbsolute && !isPosixAbsolute) {
      normalizedPath = resolve(process.cwd(), normalizedPath);
    }

    normalizedPath = normalize(normalizedPath);
    normalizedPath = normalizedPath.replace(/\\/g, '/');

    return normalizedPath;
  }

  static async validate(inputPath) {
    const normalizedPath = this.normalize(inputPath);

    try {
      await access(normalizedPath, constants.F_OK);
    } catch (error) {
      throw new Error(`Path does not exist: ${normalizedPath}`);
    }

    try {
      await access(normalizedPath, constants.R_OK | constants.X_OK);
    } catch (error) {
      throw new Error(`Path is not readable or accessible: ${normalizedPath}`);
    }

    const stats = await stat(normalizedPath);
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${normalizedPath}`);
    }

    return normalizedPath;
  }

  static async validateAndNormalize(inputPath) {
    return await this.validate(inputPath);
  }
}
