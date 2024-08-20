import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import { execSync } from 'child_process';

const getBranchName = () => execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
const getCommitHash = () => execSync('git rev-parse HEAD').toString().trim();
const getBuildDate = () => new Date().toISOString();

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [sveltekit()],
    define: {
      'import.meta.env.VITE_BUILD_INFO': JSON.stringify({
        branchName: getBranchName(),
        commitHash: getCommitHash(),
        buildDate: getBuildDate(),
      }),
      'process.env': env
    },
  };
});