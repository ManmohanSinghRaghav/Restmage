
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Completely remove the background TypeScript checker and ESLint to save RAM
      // This stops the separate subprocesses from crashing the project.
      webpackConfig.plugins = webpackConfig.plugins.filter(
        (plugin) => {
          const name = plugin.constructor ? plugin.constructor.name : '';
          return name !== 'ForkTsCheckerWebpackPlugin' && name !== 'ESLintWebpackPlugin';
        }
      );
      
      // Also disable source maps for faster, lighter builds
      webpackConfig.devtool = false;

      return webpackConfig;
    },
  },
};
